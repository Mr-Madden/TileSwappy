import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Calendar, Settings, BarChart3, Home, Menu, Share2, Lightbulb, Film } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { useSoundEffects, SoundStyle } from './hooks/useSoundEffects';
import { StartScreen } from './components/screens/StartScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { GameBoard } from './components/game/GameBoard';
import { TileSwappyLogo } from './components/TileSwappyLogo/TileSwappyLogo';
import { ThemeBackground } from './components/common/ThemeBackground';
import { ConfettiBurst } from './components/common/ConfettiBurst';
import { MainMenuWalkthrough } from './components/MainMenuWalkthrough';
import { TileMascot } from './components/TileMascot/TileMascot';
import { MascotNarrator, MascotLine } from './components/TileMascot/MascotNarrator';
import { THEMES, DEFAULT_THEME } from './theme/themes';
import { getCurrentDate } from './utils/helpers';
import { calculateCurrentStreak, STREAK_MILESTONES } from './utils/streaks';
import { shareOrDownloadImage } from './utils/shareImage';
import { useDailyPuzzleNotifications } from './hooks/useDailyPuzzleNotifications';
import { showRewardedAd } from './services/adService';

// Lazy load modals - they're not needed on initial load
const TutorialScreen = lazy(() => import('./components/screens/TutorialScreen').then(module => ({ default: module.TutorialScreen })));
const ArchiveModal = lazy(() => import('./components/modals/ArchiveModal').then(module => ({ default: module.ArchiveModal })));
const SettingsModal = lazy(() => import('./components/modals/SettingModal').then(module => ({ default: module.SettingsModal })));
const PlayerStatsModal = lazy(() => import('./components/modals/PlayerStatsModal').then(module => ({ default: module.PlayerStatsModal })));
const StreakModal = lazy(() => import('./components/modals/StreakModal').then(module => ({ default: module.StreakModal })));

declare global {
  interface Window {
    openCalendarModal?: () => void;
    openArchiveModal?: () => void;
    showPuzzleBanner?: () => void;
    hidePuzzleBanner?: () => void;
    getHeaderHeight?: () => number;
  }
}

const STORAGE_KEYS = {
  COMPLETED_PUZZLES: 'tileswappy_completed_puzzles',
  FAVORITE_PUZZLES: 'tileswappy_favorite_puzzles',
  COMPLETED_DATES: 'tileswappy_completed_dates',
  PUZZLE_STATS: 'tileswappy_puzzle_stats',
  TOTAL_GAMES: 'tileswappy_total_games',
  SETTINGS: 'tileswappy_settings',
  USER_ID: 'tileswappy_user_id',
  DAILY_PUZZLES: 'tileswappy_daily_puzzles',
  STREAK_FREEZES: 'tileswappy_streak_freezes',
  FROZEN_DATES: 'tileswappy_frozen_dates',
  FREEZE_GRANT_MONTH: 'tileswappy_freeze_grant_month',
  EXTRA_HINTS: 'tileswappy_extra_hints'
};

const MAX_STREAK_FREEZES = 3;

// Tilo's reaction pool on the regular completion screen -- distinct from
// the moves-based "Amazing!/Well Done!/Great Job!" line already shown
// above it, so the two don't just repeat each other.
const SOLVE_LINES: MascotLine[] = [
  { text: "Nailed it! On to the next one." },
  { text: "You make that look easy.", expression: 'wink' },
  { text: "Great eye for those edges!" },
  { text: "I knew you had it in you.", expression: 'love' },
  { text: "That was oddly satisfying to watch.", expression: 'laughing' },
  { text: "Come back tomorrow for a new one!" },
  { text: "Wait, how did you even see that match?", expression: 'confused' },
  { text: "Ok that one was actually impressive.", expression: 'excited' }
];

// Extra lines Tilo can pop in with if poked mid-milestone-celebration --
// the FIRST thing shown is always the specific milestone message
// (set/reset in App's milestoneBonusLine state), these only appear on
// a click after that.
const MILESTONE_BONUS_LINES: MascotLine[] = [
  { text: "Seriously, that's impressive." },
  { text: "I'm framing this moment.", expression: 'love' },
  { text: "Go on, brag a little.", expression: 'wink' },
  { text: "This deserves a victory lap.", expression: 'laughing' },
  { text: "Okay, now I'm just showing off with you.", expression: 'excited' },
  { text: "Triple-checking... yep, still real.", expression: 'confused' }
];

// Shown as a small, dismissible, auto-hiding toast -- not a modal -- if
// no new edge has matched in a while. Hint-adjacent, never a spoiler.
const STUCK_NUDGE_LINES: MascotLine[] = [
  { text: "Stuck? Try rotating a tile — sometimes that's all it takes.", expression: 'thinking' },
  { text: "Look for edges that almost match. You're closer than you think.", expression: 'happy' },
  { text: "No rush — take a breath and check the corners.", expression: 'sleepy' },
  { text: "Psst, try dragging a tile instead of tapping.", expression: 'wink' }
];

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }
};

// Loading fallback component
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-teal text-xl">Loading...</div>
  </div>
);

const App: React.FC = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const [currentPuzzleDate, setCurrentPuzzleDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [showArchive, setShowArchive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [hasProcessedCompletion, setHasProcessedCompletion] = useState(false);
  const [newBests, setNewBests] = useState<{ time: boolean; moves: boolean; swaps: boolean }>({
    time: false, moves: false, swaps: false
  });
  const [shareResultStatus, setShareResultStatus] = useState<'idle' | 'sharing' | 'done' | 'error'>('idle');
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [shareMilestoneStatus, setShareMilestoneStatus] = useState<'idle' | 'sharing' | 'done' | 'error'>('idle');
  // null = show the specific milestone message; poking Tilo swaps in a
  // bonus reaction line instead. Reset on dismiss so the NEXT milestone
  // celebration starts back on its own specific message.
  const [milestoneBonusLine, setMilestoneBonusLine] = useState<MascotLine | null>(null);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [hasShownTutorialForCurrentPuzzle, setHasShownTutorialForCurrentPuzzle] = useState(false);
  // Whether the currently-open tutorial is the once-ever onboarding one
  // shown right after the splash screen, vs. the player manually
  // reopening "How to Play" (from the home menu or mid-game) -- only the
  // former should dismiss the splash screen and chain into the main-menu
  // walkthrough when it closes.
  const [isOnboardingTutorial, setIsOnboardingTutorial] = useState(false);
  const [showMenuWalkthrough, setShowMenuWalkthrough] = useState(false);
  const [showPreMatchReveal, setShowPreMatchReveal] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<Set<string>>(() => 
    new Set(loadFromStorage<string[]>(STORAGE_KEYS.COMPLETED_PUZZLES, []))
  );
  const [favoritePuzzleIds, setFavoritePuzzleIds] = useState<Set<string>>(() => 
    new Set(loadFromStorage<string[]>(STORAGE_KEYS.FAVORITE_PUZZLES, []))
  );
  const [completedDates, setCompletedDates] = useState<Set<string>>(() => 
    new Set(loadFromStorage<string[]>(STORAGE_KEYS.COMPLETED_DATES, []))
  );
  const [puzzleStats, setPuzzleStats] = useState<Record<string, any>>(() =>
    loadFromStorage(STORAGE_KEYS.PUZZLE_STATS, {})
  );
  // Read inside the completion-detection effect below without needing
  // puzzleStats itself in that effect's dependency array -- we only
  // want the latest value at the moment a puzzle is solved, not to
  // re-run the effect every time stats change (which would include its
  // own setPuzzleStats call just below).
  const puzzleStatsRef = useRef(puzzleStats);
  useEffect(() => {
    puzzleStatsRef.current = puzzleStats;
  }, [puzzleStats]);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(() =>
    loadFromStorage(STORAGE_KEYS.TOTAL_GAMES, 0)
  );
  const [streakFreezes, setStreakFreezes] = useState(() =>
    loadFromStorage(STORAGE_KEYS.STREAK_FREEZES, 1)
  );
  const [frozenDates, setFrozenDates] = useState<Set<string>>(() =>
    new Set(loadFromStorage<string[]>(STORAGE_KEYS.FROZEN_DATES, []))
  );
  // Hint currency earned by watching a rewarded ad -- separate from the
  // one free hint every puzzle already gets (that one doesn't touch this
  // balance at all, see freeHintUsedThisPuzzle below).
  const [extraHints, setExtraHints] = useState(() =>
    loadFromStorage(STORAGE_KEYS.EXTRA_HINTS, 0)
  );
  const [freeHintUsedThisPuzzle, setFreeHintUsedThisPuzzle] = useState(false);
  const [hintAdState, setHintAdState] = useState<'idle' | 'loading'>('idle');
  const [settings, setSettings] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SETTINGS, {
      // Opt-in like every other permission-gated notification setting --
      // was previously defaulted true despite gating an actual browser
      // permission prompt, which meant the Settings toggle displayed
      // "Notifications On" for players who'd never granted anything.
      notificationsEnabled: false,
      vibrateEnabled: true,
      soundEnabled: true,
      soundStyle: 'wood' as SoundStyle,
      soundVolume: 0.8,
      theme: DEFAULT_THEME
    })
  );
  const [dailyPuzzles, setDailyPuzzles] = useState<Record<string, any>>(() => 
    loadFromStorage(STORAGE_KEYS.DAILY_PUZZLES, {})
  );
  
  const gameState = useGameState();
  const playSound = useSoundEffects(
    settings.soundEnabled ?? true,
    settings.soundStyle ?? 'wood',
    settings.soundVolume ?? 0.8
  );
  // Called here (not inside the Settings-modal-only toggle component) so
  // the hourly re-check keeps running for the whole session, not just
  // the few seconds Settings happens to be open.
  useDailyPuzzleNotifications(settings.notificationsEnabled ?? false);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COMPLETED_PUZZLES, Array.from(completedPuzzleIds));
  }, [completedPuzzleIds]);
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FAVORITE_PUZZLES, Array.from(favoritePuzzleIds));
  }, [favoritePuzzleIds]);
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COMPLETED_DATES, Array.from(completedDates));
  }, [completedDates]);
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PUZZLE_STATS, puzzleStats);
  }, [puzzleStats]);
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TOTAL_GAMES, totalGamesPlayed);
  }, [totalGamesPlayed]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STREAK_FREEZES, streakFreezes);
  }, [streakFreezes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FROZEN_DATES, Array.from(frozenDates));
  }, [frozenDates]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXTRA_HINTS, extraHints);
  }, [extraHints]);

  // Grant one streak freeze per calendar month (capped), the first time
  // the app loads in a new month.
  useEffect(() => {
    const currentMonthKey = getCurrentDate().slice(0, 7); // "YYYY-MM"
    const lastGrantedMonth = loadFromStorage<string | null>(STORAGE_KEYS.FREEZE_GRANT_MONTH, null);
    if (lastGrantedMonth !== currentMonthKey) {
      setStreakFreezes(prev => Math.min(MAX_STREAK_FREEZES, prev + 1));
      saveToStorage(STORAGE_KEYS.FREEZE_GRANT_MONTH, currentMonthKey);
    }
  }, []);

  const applyStreakFreeze = (dateStr: string) => {
    if (streakFreezes <= 0) return;
    setStreakFreezes(prev => prev - 1);
    setFrozenDates(prev => new Set([...prev, dateStr]));
  };

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    const status = gameState.gameState.status;
    // The SEO footer (sitemap links, copyright) only earns its keep on
    // the very first splash screen -- it just adds scroll weight on the
    // daily-puzzle menu and obviously has no place during actual play.
    document.body.classList.toggle('hide-site-footer', status !== 'start');
    return () => {
      document.body.classList.remove('hide-site-footer');
    };
  }, [gameState.gameState.status]);

  useEffect(() => {
    const themeId = settings.theme || DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', themeId);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const navyHex = THEMES.find((t) => t.id === themeId)?.swatch[0];
      if (navyHex) meta.setAttribute('content', navyHex);
    }
  }, [settings.theme]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DAILY_PUZZLES, dailyPuzzles);
  }, [dailyPuzzles]);

  useEffect(() => {
    const hash = window.location.hash;
    
    if (hash === '#calendar' || hash === '#archive') {
      sessionStorage.setItem('pendingModalAction', hash);
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pendingAction = sessionStorage.getItem('pendingModalAction');
    const currentStatus = gameState.gameState.status;
    
    if (currentStatus === 'idle' || currentStatus === 'start') {
      if (pendingAction) {
        if (pendingAction === '#calendar') {
          setShowStreak(true);
        } else if (pendingAction === '#archive') {
          setShowArchive(true);
        }
        sessionStorage.removeItem('pendingModalAction');
      }
    }
  }, [gameState.gameState.status, showStreak, showArchive]);

  useEffect(() => {
    window.openCalendarModal = () => setShowStreak(true);
    window.openArchiveModal = () => setShowArchive(true);
    
    return () => {
      delete window.openCalendarModal;
      delete window.openArchiveModal;
    };
  }, []);

  useEffect(() => {
    const currentStatus = gameState.gameState.status;

    if (currentStatus === 'playing' && !hasShownTutorialForCurrentPuzzle) {
      // Every fresh puzzle start is paused here, straight into the
      // pre-match reveal+countdown -- the tutorial no longer gates this.
      // It now runs once, earlier, right after the splash screen (see
      // handleStartScreenDismiss below), before the player can even
      // reach a puzzle card, so tutorialCompleted is already true by
      // the time anyone gets here.
      gameState.pauseGame();
      beginPreMatchReveal();
      setHasShownTutorialForCurrentPuzzle(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameState.status, hasShownTutorialForCurrentPuzzle]);

  const beginPreMatchReveal = () => {
    setCountdownValue(3);
    setShowPreMatchReveal(true);
  };

  useEffect(() => {
    if (!showPreMatchReveal) return;

    if (countdownValue <= 0) {
      playSound('countdownGo');
      setShowPreMatchReveal(false);
      gameState.resumeGame();
      return;
    }

    playSound('countdownTick');
    const timer = setTimeout(() => setCountdownValue(v => v - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreMatchReveal, countdownValue]);

  const handleTutorialComplete = () => {
    setShowTutorialOverlay(false);
    if (isOnboardingTutorial) {
      // The once-ever onboarding tutorial -- NOW dismiss the splash
      // screen (it was deliberately left up behind the tutorial so
      // there's nothing to see if the player backs out mid-tutorial
      // some other way) and hand off to Tilo's menu walkthrough.
      setIsOnboardingTutorial(false);
      gameState.dismissStartScreen();
      setShowMenuWalkthrough(true);
    } else {
      // Reopened manually (home menu's Tutorial button, or mid-game via
      // "How to Play") -- just close it. resumeGame() is a safe no-op
      // if the game was never paused/playing in the first place.
      gameState.resumeGame();
    }
  };

  // The splash screen's "Touch to Start" -- first time ever (no
  // tutorialCompleted flag), show the onboarding tutorial before the
  // player can reach the main menu at all; every time after, go
  // straight to the main menu like before.
  const handleStartScreenDismiss = () => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
      setIsOnboardingTutorial(true);
      setShowTutorialOverlay(true);
    } else {
      gameState.dismissStartScreen();
    }
  };

  // Same reset as the pause modal's "Quit to Home" -- but reachable
  // directly from the gameboard's top bar, without pausing first. Confirms
  // before discarding an in-progress puzzle; a solved one has nothing left
  // to lose, so it skips the prompt.
  // First hint per puzzle is free; after that it draws from the extraHints
  // balance (earned by watching a rewarded ad). If the balance is empty,
  // this triggers the ad itself. If findHintMove genuinely can't find a
  // helpful single move (rare -- see its own comment), nothing is spent:
  // a watched-but-unspendable ad is instead banked as a hint credit so
  // the reward isn't just lost.
  const handleHintClick = async () => {
    if (gameState.gameState.status !== 'playing' || gameState.gameState.isPaused || hintAdState === 'loading') {
      return;
    }

    if (!freeHintUsedThisPuzzle) {
      if (gameState.useHint()) {
        setFreeHintUsedThisPuzzle(true);
        triggerHaptic(15);
        playSound('click');
      }
      return;
    }

    if (extraHints > 0) {
      if (gameState.useHint()) {
        setExtraHints(prev => prev - 1);
        triggerHaptic(15);
        playSound('click');
      }
      return;
    }

    setHintAdState('loading');
    const rewarded = await showRewardedAd();
    if (!rewarded) {
      setHintAdState('idle');
      return;
    }

    if (gameState.useHint()) {
      triggerHaptic(15);
      playSound('click');
    } else {
      setExtraHints(prev => prev + 1);
    }
    setHintAdState('idle');
  };

  const handleQuitToHome = () => {
    const canQuitSilently = gameState.gameState.status === 'solved';
    if (!canQuitSilently && !window.confirm('Quit to home? Your progress on this puzzle will be lost.')) {
      return;
    }
    setHasProcessedCompletion(false);
    setShowCompletionAnimation(false);
    gameState.resumeGame();
    gameState.resetGame();
  };

const handleStartPuzzle = (puzzle?: any, puzzleDate?: string) => {
  // Always normalize the date
  const dateToUse = puzzleDate || new Date().toISOString().split('T')[0];

  // Normalize puzzle object OR generate fallback puzzle
  let normalizedPuzzle = puzzle;

  // If puzzle came from API but uses snake_case
  if (normalizedPuzzle?.image_url && !normalizedPuzzle?.imageUrl) {
    normalizedPuzzle = {
      ...normalizedPuzzle,
      imageUrl: normalizedPuzzle.image_url
    };
  }

  // If no puzzle exists for this date, generate a fallback puzzle
  if (!normalizedPuzzle) {
    normalizedPuzzle = {
      title: `Puzzle for ${dateToUse}`,
      date: dateToUse,
      difficulty: 'Medium',
      gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
      fromDatabase: false
    };
  }

  // Ensure required metadata always exists
  normalizedPuzzle = {
    ...normalizedPuzzle,
    date: normalizedPuzzle.date || dateToUse,
    title: normalizedPuzzle.title || `Puzzle for ${dateToUse}`,
    difficulty: normalizedPuzzle.difficulty || 'Medium',
    imageUrl: normalizedPuzzle.imageUrl || null,
    gradient: normalizedPuzzle.gradient || ['#ff6b6b', '#4ecdc4', '#45b7d1']
  };

  // Save puzzle to dailyPuzzles
  setDailyPuzzles(prev => ({
    ...prev,
    [dateToUse]: normalizedPuzzle
  }));

  // Reset UI state
  setHasProcessedCompletion(false);
  setShowCompletionAnimation(false);
  setHasShownTutorialForCurrentPuzzle(false);
  setFreeHintUsedThisPuzzle(false);
  setNewBests({ time: false, moves: false, swaps: false });

  // Set current puzzle
  setCurrentPuzzleDate(dateToUse);
  setCurrentPuzzle(normalizedPuzzle);

  // Start the game
  gameState.startGame(normalizedPuzzle);
};



  // navigator.vibrate is Android/Chrome only -- iOS Safari has no
  // Vibration API at all, so this is a graceful no-op there rather than
  // a feature every platform gets.
  const triggerHaptic = (pattern: number | number[]) => {
    if (settings.vibrateEnabled === false) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleSelectTile = (tileId: string) => {
    if (gameState.gameState.selectedTile === null) {
      gameState.selectTile(tileId);
      triggerHaptic(10);
      playSound('tap');
    } else if (gameState.gameState.selectedTile === tileId) {
      gameState.selectTile(null);
    } else {
      gameState.swapTiles(gameState.gameState.selectedTile, tileId);
      triggerHaptic(20);
      playSound('swap');
    }
  };

  const handleRotateTile = (tileId: string, direction: 1 | -1) => {
    // direction 1 => +90 (clockwise), -1 => +270 (i.e. -90, counterclockwise)
    // -- matches TutorialScreen's own rotateTile, which does `rotation +
    // direction` directly. This mapping used to be inverted (270/90
    // swapped), so a flick that the tutorial taught as one direction
    // rotated the opposite way in real gameplay.
    gameState.rotateTile(tileId, direction > 0 ? 90 : 270);
    triggerHaptic(10);
    playSound('rotate');
  };

  const handleSwapTiles = (tileId1: string, tileId2: string) => {
    gameState.swapTiles(tileId1, tileId2);
    if (gameState.gameState.selectedTile) {
      gameState.selectTile(null);
    }
    triggerHaptic(20);
    playSound('swap');
  };

  const handleToggleFavorite = (puzzleId: string) => {
    setFavoritePuzzleIds(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(puzzleId)) {
        newFavorites.delete(puzzleId);
      } else {
        newFavorites.add(puzzleId);
      }
      return newFavorites;
    });
  };

  const handleDateSelect = (dateStr: string, puzzleData?: any) => {
    if (puzzleData) {
      handleStartPuzzle(puzzleData, dateStr);
    } else {
      const puzzleForDate = dailyPuzzles[dateStr];
      
      if (puzzleForDate) {
        handleStartPuzzle(puzzleForDate, dateStr);
      } else {
        handleStartPuzzle(
          {
            title: `Puzzle for ${dateStr}`,
            date: dateStr,
            difficulty: 'Medium',
            gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1']
          },
          dateStr
        );
      }
    }
    
    setShowStreak(false);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  // Includes today, since setCompletedDates already ran earlier in the
  // same completion effect that shows this screen -- so a player who
  // just solved their first puzzle in a row sees "1 Day Streak", not 0.
  const currentStreak = calculateCurrentStreak(completedDates, frozenDates, getCurrentDate());

  // A Wordle-style "share what you just solved" card -- separate from
  // PlayerStatsModal's aggregate stats card, this one is scoped to
  // today's specific puzzle, shown right at the moment of completion
  // when a player is most likely to want to brag about it. Deliberately
  // draws the puzzle's gradient rather than its real photo -- loading a
  // cross-origin image onto the canvas risks tainting it, which would
  // silently break canvas.toBlob() below.
  const buildResultCardCanvas = (): HTMLCanvasElement => {
    const size = 1080;
    const height = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    const cssColor = (name: string, fallback: string) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return raw ? `rgb(${raw})` : fallback;
    };

    const navy = cssColor('--color-navy', '#0d1b2a');
    const navyDark = cssColor('--color-navy-dark', '#08131d');
    const coral = cssColor('--color-coral', '#ff4c4c');
    const teal = cssColor('--color-teal', '#2ec4b6');
    const gold = cssColor('--color-gold', '#fbbf24');
    const offwhite = cssColor('--color-offwhite', '#f5f5f0');

    const bgGrad = ctx.createLinearGradient(0, 0, size, height);
    bgGrad.addColorStop(0, navy);
    bgGrad.addColorStop(1, navyDark);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, height);

    // Wordmark: 2x2 tile mark + "TileSwappy"
    const mx = 90, my = 90, markSize = 80, mgap = 8;
    const half = (markSize - mgap) / 2;
    ctx.fillStyle = offwhite;
    ctx.fillRect(mx, my, half, half);
    ctx.fillStyle = coral;
    ctx.fillRect(mx + half + mgap, my, half, half);
    ctx.fillStyle = teal;
    ctx.fillRect(mx, my + half + mgap, half, half);
    ctx.fillStyle = offwhite;
    ctx.fillRect(mx + half + mgap, my + half + mgap, half, half);

    ctx.fillStyle = offwhite;
    ctx.font = '600 52px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('TileSwappy', mx + markSize + 28, my + markSize / 2);

    // Puzzle-colored banner, standing in for the actual photo
    const bannerX = 90;
    const bannerY = 240;
    const bannerW = size - 180;
    const bannerH = 300;
    const stops: string[] = currentPuzzle?.gradient?.length ? currentPuzzle.gradient : [coral, teal];
    const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
    stops.forEach((c: string, i: number) => bannerGrad.addColorStop(stops.length > 1 ? i / (stops.length - 1) : 0, c));
    const bRadius = 28;
    ctx.beginPath();
    ctx.moveTo(bannerX + bRadius, bannerY);
    ctx.arcTo(bannerX + bannerW, bannerY, bannerX + bannerW, bannerY + bannerH, bRadius);
    ctx.arcTo(bannerX + bannerW, bannerY + bannerH, bannerX, bannerY + bannerH, bRadius);
    ctx.arcTo(bannerX, bannerY + bannerH, bannerX, bannerY, bRadius);
    ctx.arcTo(bannerX, bannerY, bannerX + bannerW, bannerY, bRadius);
    ctx.closePath();
    ctx.fillStyle = bannerGrad;
    ctx.fill();

    // Same dark-scrim-then-light-text approach HomeScreen's puzzle cards
    // use over their thumbnails -- plain dark text sat unreadable against
    // whichever half of the gradient happened to be light.
    ctx.fillStyle = 'rgba(10, 14, 20, 0.4)';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = offwhite;
    ctx.font = '700 42px system-ui, -apple-system, sans-serif';
    const bannerLabel = (currentPuzzle?.themeName || currentPuzzle?.title || 'Daily Puzzle').toUpperCase();
    ctx.fillText(bannerLabel, bannerX + bannerW / 2, bannerY + bannerH / 2);

    // Headline + date
    ctx.fillStyle = offwhite;
    ctx.font = '800 68px system-ui, -apple-system, sans-serif';
    ctx.fillText('SOLVED!', size / 2, bannerY + bannerH + 100);

    const dateLabel = new Date(`${currentPuzzleDate}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    ctx.fillStyle = teal;
    ctx.font = '600 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(dateLabel, size / 2, bannerY + bannerH + 155);

    // Stat row: Moves / Swaps / Time
    const stats: [string, string, boolean][] = [
      [String(gameState.gameState.moves), 'MOVES', newBests.moves],
      [String(gameState.gameState.swaps), 'SWAPS', newBests.swaps],
      [formatTime(gameState.gameState.solveTime || 0), 'TIME', newBests.time]
    ];

    const gridTop = bannerY + bannerH + 220;
    const cellGap = 24;
    const cellW = (bannerW - cellGap * 2) / 3;
    const cellH = 220;

    stats.forEach(([value, label, isBest], i) => {
      const x = bannerX + i * (cellW + cellGap);
      const y = gridTop;
      const r = 20;

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + cellW, y, x + cellW, y + cellH, r);
      ctx.arcTo(x + cellW, y + cellH, x, y + cellH, r);
      ctx.arcTo(x, y + cellH, x, y, r);
      ctx.arcTo(x, y, x + cellW, y, r);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = i === 1 ? teal : coral;
      ctx.font = '700 54px system-ui, -apple-system, sans-serif';
      ctx.fillText(value, x + cellW / 2, y + cellH / 2 - 10);

      ctx.fillStyle = offwhite;
      ctx.globalAlpha = 0.6;
      ctx.font = '600 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(label, x + cellW / 2, y + cellH / 2 + 40);
      ctx.globalAlpha = 1;

      if (isBest) {
        ctx.fillStyle = gold;
        ctx.font = '800 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('★ NEW BEST', x + cellW / 2, y - 18);
      }
    });

    if (currentStreak > 0) {
      ctx.fillStyle = coral;
      ctx.font = '700 42px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        currentStreak === 1 ? '1 Day Streak' : `${currentStreak} Day Streak`,
        size / 2,
        gridTop + cellH + 90
      );
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = offwhite;
    ctx.globalAlpha = 0.4;
    ctx.font = '500 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('tileswappy.com', size / 2, height - 60);
    ctx.globalAlpha = 1;

    return canvas;
  };

  const handleShareResult = async () => {
    setShareResultStatus('sharing');
    try {
      const canvas = buildResultCardCanvas();
      await shareOrDownloadImage(canvas, 'tileswappy-result.png', 'My TileSwappy Result');
      setShareResultStatus('done');
    } catch (err) {
      setShareResultStatus((err as any)?.name === 'AbortError' ? 'idle' : 'error');
    } finally {
      setTimeout(() => setShareResultStatus('idle'), 2500);
    }
  };

  useEffect(() => {
    if (gameState.gameState.status === 'solved' && !hasProcessedCompletion) {
      setHasProcessedCompletion(true);
      setShowCompletionAnimation(true);
      setTotalGamesPlayed(prev => prev + 1);
      triggerHaptic([15, 60, 15, 60, 30]);
      playSound('solved');

      const puzzleKey = currentPuzzle?.date || currentPuzzleDate || 'today';
      const puzzleTitle = currentPuzzle?.title || null;
      // Captured once per puzzle (same keep-existing-if-already-set
      // pattern as puzzleTitle below) so Player Stats can render a mini
      // thumbnail without re-fetching puzzle data it no longer has
      // handy -- photo puzzles carry imageUrl, practice/gradient
      // puzzles carry gradient+pattern+direction instead.
      const puzzleImageUrl = currentPuzzle?.imageUrl || currentPuzzle?.image_url || null;
      const puzzleGradient = currentPuzzle?.gradient || null;
      const puzzlePattern = currentPuzzle?.pattern || null;
      const puzzleDirection = currentPuzzle?.direction || null;

      setCompletedPuzzleIds(prev => new Set([...prev, puzzleKey]));
      
      const isAdminPuzzle = currentPuzzle?.imageUrl || currentPuzzle?.image_url || currentPuzzle?.fromDatabase;
      if (isAdminPuzzle) {
        setCompletedDates(prev => new Set([...prev, currentPuzzleDate]));

        // Computed locally rather than off the completedDates STATE --
        // setCompletedDates above hasn't re-rendered yet, so that
        // closure still holds the set from BEFORE this solve, and would
        // miss a streak that just reached a milestone today.
        const streakAfterThisSolve = calculateCurrentStreak(
          new Set([...completedDates, currentPuzzleDate]),
          frozenDates,
          getCurrentDate()
        );
        if (STREAK_MILESTONES.includes(streakAfterThisSolve)) {
          setMilestoneStreak(streakAfterThisSolve);
        }
      }

      const finalTime = gameState.gameState.solveTime || 0;
      const finalMoves = gameState.gameState.moves;
      const finalSwaps = gameState.gameState.swaps;

      // Compare against the PRIOR best (before this run overwrites it)
      // to decide what to celebrate. Only counts once there's been at
      // least one earlier attempt -- a first-ever completion trivially
      // "beats" a null best, which isn't a real improvement worth a
      // New Best badge. Each stat is judged independently (you can set
      // a new best in moves without also being your fastest time).
      const priorStats = puzzleStatsRef.current[puzzleKey];
      const hasPriorAttempt = !!priorStats && priorStats.attempts > 0;
      setNewBests({
        time: hasPriorAttempt && priorStats.bestTime != null && finalTime < priorStats.bestTime,
        moves: hasPriorAttempt && priorStats.bestMoves != null && finalMoves < priorStats.bestMoves,
        swaps: hasPriorAttempt && priorStats.bestSwaps != null && finalSwaps < priorStats.bestSwaps
      });

      setPuzzleStats(prev => {
        const currentStats = prev[puzzleKey] || {
          attempts: 0,
          bestTime: null,
          bestMoves: null,
          bestSwaps: null,
          completionDates: [],
          puzzleTitle: null,
          puzzleImageUrl: null,
          puzzleGradient: null,
          puzzlePattern: null,
          puzzleDirection: null
        };

        const isNewBest = !currentStats.bestTime || finalTime < currentStats.bestTime;

        return {
          ...prev,
          [puzzleKey]: {
            attempts: currentStats.attempts + 1,
            bestTime: isNewBest ? finalTime : currentStats.bestTime,
            bestMoves: isNewBest ? finalMoves : currentStats.bestMoves,
            bestSwaps: isNewBest ? finalSwaps : currentStats.bestSwaps,
            lastPlayedTime: finalTime,
            lastPlayedMoves: finalMoves,
            lastPlayedSwaps: finalSwaps,
            completionDates: [...currentStats.completionDates, new Date().toISOString()],
            puzzleTitle: puzzleTitle || currentStats.puzzleTitle,
            puzzleImageUrl: puzzleImageUrl || currentStats.puzzleImageUrl,
            puzzleGradient: puzzleGradient || currentStats.puzzleGradient,
            puzzlePattern: puzzlePattern || currentStats.puzzlePattern,
            puzzleDirection: puzzleDirection || currentStats.puzzleDirection
          }
        };
      });
    }
  }, [gameState.gameState.status, gameState.gameState.solveTime, gameState.gameState.moves, gameState.gameState.swaps, hasProcessedCompletion, currentPuzzle, currentPuzzleDate]);

  // The completion screen now stays up until the player dismisses it
  // (tapping anywhere outside the card) rather than auto-advancing on a
  // timer -- so it can't vanish out from under someone still reading
  // their stats or mid-share. If today's solve also just crossed a
  // streak milestone, route to that celebration next instead of
  // straight to the Streak modal.
  const dismissCompletionAnimation = () => {
    setShowCompletionAnimation(false);
    if (milestoneStreak) {
      setShowMilestoneCelebration(true);
    } else {
      setShowStreak(true);
    }
  };

  const dismissMilestoneCelebration = () => {
    setShowMilestoneCelebration(false);
    setMilestoneStreak(null);
    setMilestoneBonusLine(null);
    setShowStreak(true);
  };

  const handleMilestoneMascotClick = () => {
    setMilestoneBonusLine((prev) => {
      let next = MILESTONE_BONUS_LINES[Math.floor(Math.random() * MILESTONE_BONUS_LINES.length)];
      if (next.text === prev?.text) {
        next = MILESTONE_BONUS_LINES[Math.floor(Math.random() * MILESTONE_BONUS_LINES.length)];
      }
      return next;
    });
  };

  const MILESTONE_MESSAGES: Record<number, string> = {
    7: "One week strong! You're building something great.",
    30: "30 days?! That's a real habit now. Incredible work.",
    100: "100 days. Triple digits. Absolute legend status."
  };

  const buildMilestoneCardCanvas = (streak: number): HTMLCanvasElement => {
    const size = 1080;
    const height = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    const cssColor = (name: string, fallback: string) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return raw ? `rgb(${raw})` : fallback;
    };

    const navy = cssColor('--color-navy', '#0d1b2a');
    const navyDark = cssColor('--color-navy-dark', '#08131d');
    const coral = cssColor('--color-coral', '#ff4c4c');
    const teal = cssColor('--color-teal', '#2ec4b6');
    const gold = cssColor('--color-gold', '#fbbf24');
    const offwhite = cssColor('--color-offwhite', '#f5f5f0');

    const bgGrad = ctx.createLinearGradient(0, 0, size, height);
    bgGrad.addColorStop(0, navy);
    bgGrad.addColorStop(1, navyDark);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, height);

    const mx = 90, my = 90, markSize = 80, mgap = 8;
    const half = (markSize - mgap) / 2;
    ctx.fillStyle = offwhite;
    ctx.fillRect(mx, my, half, half);
    ctx.fillStyle = coral;
    ctx.fillRect(mx + half + mgap, my, half, half);
    ctx.fillStyle = teal;
    ctx.fillRect(mx, my + half + mgap, half, half);
    ctx.fillStyle = offwhite;
    ctx.fillRect(mx + half + mgap, my + half + mgap, half, half);

    ctx.fillStyle = offwhite;
    ctx.font = '600 52px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('TileSwappy', mx + markSize + 28, my + markSize / 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = gold;
    ctx.font = '800 340px system-ui, -apple-system, sans-serif';
    ctx.fillText(String(streak), size / 2, 560);

    ctx.fillStyle = offwhite;
    ctx.font = '700 56px system-ui, -apple-system, sans-serif';
    ctx.fillText('DAY STREAK', size / 2, 740);

    ctx.fillStyle = teal;
    ctx.font = '600 34px system-ui, -apple-system, sans-serif';
    const message = MILESTONE_MESSAGES[streak] || "Still going strong!";
    // Wrap the message across a couple of lines rather than letting it
    // run off the edges -- it's plain-language copy, not a fixed label.
    const words = message.split(' ');
    const lines: string[] = [];
    let line = '';
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > size - 220 && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, size / 2, 830 + i * 48));

    ctx.textAlign = 'center';
    ctx.fillStyle = offwhite;
    ctx.globalAlpha = 0.4;
    ctx.font = '500 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('tileswappy.com', size / 2, height - 60);
    ctx.globalAlpha = 1;

    return canvas;
  };

  const handleShareMilestone = async () => {
    if (!milestoneStreak) return;
    setShareMilestoneStatus('sharing');
    try {
      const canvas = buildMilestoneCardCanvas(milestoneStreak);
      await shareOrDownloadImage(canvas, 'tileswappy-streak.png', `My ${milestoneStreak}-Day TileSwappy Streak`);
      setShareMilestoneStatus('done');
    } catch (err) {
      setShareMilestoneStatus((err as any)?.name === 'AbortError' ? 'idle' : 'error');
    } finally {
      setTimeout(() => setShareMilestoneStatus('idle'), 2500);
    }
  };

  // A small reward chime whenever a swap/rotate causes a NEW edge to
  // start glowing -- only on increases, so undoing a match (or a swap
  // that breaks one) stays silent instead of also "celebrating". Layers
  // on top of the swap/rotate sound that triggered it rather than
  // replacing it, same as a combo sound in other games.
  const prevMatchCountRef = useRef(0);
  const lastMatchProgressRef = useRef(Date.now());
  useEffect(() => {
    const currentCount = gameState.gameState.matchingEdges.size;
    if (currentCount > prevMatchCountRef.current) {
      playSound('match');
      lastMatchProgressRef.current = Date.now();
    }
    prevMatchCountRef.current = currentCount;
  }, [gameState.gameState.matchingEdges, playSound]);

  // A small, dismissible, auto-hiding nudge -- not a modal, and never
  // more than once per COOLDOWN_MS -- if no new edge has matched for a
  // while during actual play. Deliberately keyed off match PROGRESS
  // rather than every swap/rotate: someone actively experimenting but
  // just not landing a match yet is still exactly who this is for.
  const [stuckNudge, setStuckNudge] = useState<MascotLine | null>(null);
  const lastNudgeRef = useRef(0);
  const stuckNudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (gameState.gameState.status === 'playing') {
      lastMatchProgressRef.current = Date.now();
      lastNudgeRef.current = 0;
    }
  }, [currentPuzzleDate, gameState.gameState.status]);

  useEffect(() => {
    if (gameState.gameState.status !== 'playing' || gameState.gameState.isPaused) return;

    const STUCK_MS = 45000;
    const COOLDOWN_MS = 90000;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastMatchProgressRef.current >= STUCK_MS && now - lastNudgeRef.current >= COOLDOWN_MS) {
        lastNudgeRef.current = now;
        setStuckNudge(STUCK_NUDGE_LINES[Math.floor(Math.random() * STUCK_NUDGE_LINES.length)]);
        clearTimeout(stuckNudgeTimeoutRef.current);
        stuckNudgeTimeoutRef.current = setTimeout(() => setStuckNudge(null), 6000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameState.gameState.status, gameState.gameState.isPaused]);

  useEffect(() => {
    const cleanupOldStats = () => {
      const stats = loadFromStorage(STORAGE_KEYS.PUZZLE_STATS, {});
      let needsCleanup = false;
      const cleanedStats: Record<string, any> = {};
      
      Object.entries(stats).forEach(([key, value]) => {
        const isUUID = key.length > 30 && key.includes('-');
        
        if (isUUID) {
          needsCleanup = true;
        } else {
          cleanedStats[key] = value;
        }
      });
      
      if (needsCleanup) {
        setPuzzleStats(cleanedStats);
        saveToStorage(STORAGE_KEYS.PUZZLE_STATS, cleanedStats);
      }
    };
    
    cleanupOldStats();
  }, []);

  return (
    <div className="min-h-screen bg-navy">
      <ThemeBackground theme={settings.theme || DEFAULT_THEME} />
      <TileSwappyLogo size={150} bouncing />
      
      {gameState.gameState.status === 'start' && (
        <StartScreen onStart={handleStartScreenDismiss} onOpenSettings={() => setShowSettings(true)} />
      )}

      {gameState.gameState.status === 'idle' && (
        <HomeScreen
          onStartPuzzle={(puzzle) => handleStartPuzzle(puzzle)}
          onOpenArchive={() => setShowArchive(true)}
          onOpenStreak={() => setShowStreak(true)}
          onOpenStats={() => setShowPlayerStats(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenTutorial={() => setShowTutorialOverlay(true)}
          suppressIdleHints={showMenuWalkthrough}
        />
      )}

      {showMenuWalkthrough && (
        <MainMenuWalkthrough onComplete={() => setShowMenuWalkthrough(false)} />
      )}

      {showArchive && (
        <Suspense fallback={<ModalLoader />}>
          <ArchiveModal
            onClose={() => setShowArchive(false)}
            completedPuzzleIds={completedPuzzleIds}
            favoritePuzzleIds={favoritePuzzleIds}
            onToggleFavorite={handleToggleFavorite}
            onStartPuzzle={(puzzle) => handleStartPuzzle(puzzle)}
          />
        </Suspense>
      )}

      {showPlayerStats && (
        <Suspense fallback={<ModalLoader />}>
          <PlayerStatsModal
            onClose={() => setShowPlayerStats(false)}
            puzzleStats={puzzleStats}
            totalGamesPlayed={totalGamesPlayed}
            completedDates={completedDates}
            frozenDates={frozenDates}
          />
        </Suspense>
      )}

      {showStreak && (
        <Suspense fallback={<ModalLoader />}>
          <StreakModal
            onClose={() => setShowStreak(false)}
            completedDates={completedDates}
            onDateSelect={(dateStr, puzzleData) => handleDateSelect(dateStr, puzzleData)}
            puzzleStats={puzzleStats}
            frozenDates={frozenDates}
            streakFreezes={streakFreezes}
            onApplyFreeze={applyStreakFreeze}
          />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={<ModalLoader />}>
          <SettingsModal
            onClose={() => setShowSettings(false)}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          />
        </Suspense>
      )}

      {showTutorialOverlay && (
        <Suspense fallback={<ModalLoader />}>
          <TutorialScreen onComplete={handleTutorialComplete} />
        </Suspense>
      )}

      {showPreMatchReveal && (
        <div className="fixed inset-0 bg-navy z-[100] flex flex-col items-center justify-center p-4">
          <p className="text-teal text-lg font-semibold mb-1 tracking-wide uppercase">Get Ready</p>
          <p className="text-offwhite/60 text-sm mb-4 text-center max-w-xs">This is the one correct picture — every tile has exactly one right neighbor.</p>
          <div
            className="rounded-2xl overflow-hidden border-4 border-coral shadow-coral-glow mb-8"
            style={{ width: 'min(75vw, 420px)', height: 'min(75vw, 420px)' }}
          >
            {currentPuzzle?.imageUrl || currentPuzzle?.image_url ? (
              <img
                src={currentPuzzle.imageUrl || currentPuzzle.image_url}
                alt="Completed puzzle preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${(currentPuzzle?.gradient ?? ['#ff6b6b', '#4ecdc4', '#45b7d1']).join(', ')})`
                }}
              />
            )}
          </div>
          <div className="flex items-center justify-center gap-4">
            {/* Tilo's expression builds anticipation as the countdown ticks
                down, and re-pops each second the same way the number
                itself does (same key-remount trick, same animation class). */}
            <div key={`tilo-${countdownValue}`} className="pre-match-countdown-pop">
              <TileMascot
                size={64}
                expression={countdownValue <= 1 ? 'excited' : countdownValue === 2 ? 'surprised' : 'thinking'}
                color="coral"
                bounce={false}
              />
            </div>
            <div key={countdownValue} className="text-8xl font-extrabold text-coral pre-match-countdown-pop">
              {countdownValue}
            </div>
          </div>

          <style>{`
            @keyframes pre-match-countdown-pop {
              0% { transform: scale(0.4); opacity: 0; }
              60% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }

            .pre-match-countdown-pop {
              animation: pre-match-countdown-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            @media (prefers-reduced-motion: reduce) {
              .pre-match-countdown-pop {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}

      {showCompletionAnimation && (
        <div
          onClick={dismissCompletionAnimation}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center overflow-hidden"
        >
          <ConfettiBurst count={newBests.time || newBests.moves || newBests.swaps ? 90 : 55} />

          <div className="text-center relative z-10" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 animate-bounce-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-teal/30 rounded-full blur-2xl animate-pulse"></div>

                {/* Sonar rings -- fire on every win, gold when it's a new best */}
                <div
                  className={`absolute inset-0 rounded-full trophy-ring ${
                    newBests.time || newBests.moves || newBests.swaps ? 'trophy-ring--gold' : 'trophy-ring--teal'
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full trophy-ring trophy-ring--delay ${
                    newBests.time || newBests.moves || newBests.swaps ? 'trophy-ring--gold' : 'trophy-ring--teal'
                  }`}
                />

                {(newBests.time || newBests.moves || newBests.swaps) && (
                  <div className="absolute inset-[-30px] animate-starburst">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1 h-10 bg-gradient-to-t from-transparent to-gold-light rounded-full"
                        style={{ transform: `rotate(${i * 30}deg) translateY(-70px)`, transformOrigin: 'center bottom' }}
                      />
                    ))}
                  </div>
                )}

                {[
                  { top: '-8%', left: '4%' },
                  { top: '6%', right: '-10%' },
                  { top: '74%', left: '-12%' },
                  { top: '82%', right: '0%' }
                ].map((pos, i) => (
                  <span
                    key={i}
                    className="absolute trophy-sparkle"
                    style={{ ...pos, animationDelay: `${i * 0.3}s` }}
                  >
                    ✨
                  </span>
                ))}

                <div className="relative text-9xl trophy-idle">
                  🏆
                </div>
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal via-coral to-teal mb-2 animate-gradient">
                Puzzle Solved!
              </h2>
            </div>

            {(newBests.time || newBests.moves || newBests.swaps) && (
              <div className="animate-badge-pop mb-4" style={{ animationDelay: '0.3s' }}>
                <span className="inline-block bg-gradient-to-r from-gold to-gold-dark text-navy font-extrabold text-sm px-4 py-1.5 rounded-full shadow-gold-glow">
                  🎉 New Personal Best!
                </span>
              </div>
            )}

            <div className="flex gap-4 justify-center mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative bg-navy-light/80 backdrop-blur-sm border-2 border-coral rounded-xl px-6 py-3 shadow-coral-glow">
                {newBests.moves && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold text-navy text-[9px] font-bold px-2 py-0.5 rounded-full animate-badge-pop shadow-gold-glow">
                    ★ BEST
                  </span>
                )}
                <div className="text-3xl font-bold text-coral">
                  {gameState.gameState.moves}
                </div>
                <div className="text-xs text-teal font-semibold">Moves</div>
              </div>

              <div className="relative bg-navy-light/80 backdrop-blur-sm border-2 border-teal rounded-xl px-6 py-3 shadow-teal-glow">
                {newBests.swaps && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold text-navy text-[9px] font-bold px-2 py-0.5 rounded-full animate-badge-pop shadow-gold-glow">
                    ★ BEST
                  </span>
                )}
                <div className="text-3xl font-bold text-teal">
                  {gameState.gameState.swaps}
                </div>
                <div className="text-xs text-offwhite font-semibold">Swaps</div>
              </div>

              <div className="relative bg-navy-light/80 backdrop-blur-sm border-2 border-coral rounded-xl px-6 py-3 shadow-coral-glow">
                {newBests.time && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold text-navy text-[9px] font-bold px-2 py-0.5 rounded-full animate-badge-pop shadow-gold-glow">
                    ★ BEST
                  </span>
                )}
                <div className="text-2xl font-bold font-mono text-coral">
                  {formatTime(gameState.gameState.solveTime || 0)}
                </div>
                <div className="text-xs text-teal font-semibold">Time</div>
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <p className="text-xl text-offwhite font-semibold">
                {gameState.gameState.moves < 20 ? '🌟 Amazing!' :
                 gameState.gameState.moves < 30 ? '✨ Well Done!' :
                 '🎯 Great Job!'}
              </p>
            </div>

            {currentPuzzle?.themeName && (
              <div className="animate-slide-up mt-3" style={{ animationDelay: '0.8s' }}>
                <p className="text-sm text-teal/80">
                  You solved: <span className="text-offwhite font-bold">{currentPuzzle.themeName}</span>
                  {currentPuzzle.themeStyleTag && (
                    <span className="text-teal/60"> ({currentPuzzle.themeStyleTag})</span>
                  )}
                </p>
              </div>
            )}

            <div className="animate-slide-up mt-4 flex justify-center" style={{ animationDelay: '0.95s' }}>
              <MascotNarrator lines={SOLVE_LINES} expression="excited" color="coral" size={52} />
            </div>

            <div className="animate-slide-up mt-5" style={{ animationDelay: '1.1s' }}>
              <button
                onClick={handleShareResult}
                disabled={shareResultStatus === 'sharing'}
                className="inline-flex items-center gap-2 bg-navy-light/80 backdrop-blur-sm border-2 border-teal hover:bg-teal hover:text-navy-dark text-teal font-bold px-5 py-2.5 rounded-xl transition shadow-teal-glow disabled:opacity-60"
              >
                <Share2 size={16} />
                {shareResultStatus === 'sharing'
                  ? 'Preparing…'
                  : shareResultStatus === 'done'
                  ? 'Shared!'
                  : shareResultStatus === 'error'
                  ? 'Couldn’t share'
                  : 'Share Result'}
              </button>
            </div>

            <div className="animate-slide-up mt-4" style={{ animationDelay: '1.2s' }}>
              <p className="text-xs text-offwhite/40">Tap anywhere to continue</p>
            </div>
          </div>

          <style>{`
            @keyframes bounce-in {
              0% {
                transform: scale(0) rotate(-180deg);
                opacity: 0;
              }
              50% {
                transform: scale(1.1) rotate(10deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }

            @keyframes slide-up {
              0% {
                transform: translateY(30px);
                opacity: 0;
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }

            @keyframes trophy-idle {
              0%, 100% { transform: rotate(-5deg) scale(1); }
              50% { transform: rotate(5deg) scale(1.06); }
            }

            @keyframes trophy-ring-ping {
              0% { transform: scale(0.6); opacity: 0.55; }
              100% { transform: scale(1.9); opacity: 0; }
            }

            @keyframes trophy-sparkle-twinkle {
              0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0; }
              50% { transform: scale(1.1) rotate(15deg); opacity: 1; }
            }

            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }

            @keyframes starburst {
              0% { transform: scale(0.3) rotate(0deg); opacity: 0; }
              30% { opacity: 1; }
              100% { transform: scale(1.4) rotate(90deg); opacity: 0; }
            }

            @keyframes badge-pop {
              0% { transform: scale(0) translateX(-50%); opacity: 0; }
              60% { transform: scale(1.15) translateX(-50%); }
              100% { transform: scale(1) translateX(-50%); opacity: 1; }
            }

            .animate-bounce-in {
              animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .animate-slide-up {
              animation: slide-up 0.5s ease-out forwards;
              opacity: 0;
            }

            .trophy-idle {
              display: inline-block;
              animation: trophy-idle 1.8s ease-in-out infinite;
            }

            .trophy-ring {
              border: 2px solid currentColor;
              animation: trophy-ring-ping 1.8s ease-out infinite;
            }

            .trophy-ring--teal {
              color: rgb(var(--color-teal));
            }

            .trophy-ring--gold {
              color: rgb(var(--color-gold));
            }

            .trophy-ring--delay {
              animation-delay: 0.9s;
            }

            .trophy-sparkle {
              font-size: 1.25rem;
              animation: trophy-sparkle-twinkle 1.6s ease-in-out infinite;
            }

            .animate-gradient {
              background-size: 200% auto;
              animation: gradient 3s ease infinite;
            }

            .animate-starburst {
              animation: starburst 1.4s ease-out infinite;
            }

            .animate-badge-pop {
              animation: badge-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
            }

            .shadow-coral-glow {
              box-shadow: 0 0 20px rgb(var(--color-coral) / 0.4);
            }

            .shadow-teal-glow {
              box-shadow: 0 0 20px rgb(var(--color-teal) / 0.4);
            }

            @media (prefers-reduced-motion: reduce) {
              .animate-bounce-in,
              .animate-slide-up,
              .animate-gradient,
              .animate-starburst,
              .animate-badge-pop,
              .trophy-idle,
              .trophy-ring,
              .trophy-sparkle {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}

      {showMilestoneCelebration && milestoneStreak && (
        <div
          onClick={dismissMilestoneCelebration}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center overflow-hidden"
        >
          <ConfettiBurst count={110} />

          <div className="text-center relative z-10 px-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4 milestone-mascot-pop">
              <TileMascot
                size={110}
                expression={milestoneBonusLine?.expression ?? 'excited'}
                color="gold"
                bounce={false}
                onClick={handleMilestoneMascotClick}
              />
            </div>

            <p className="milestone-slide-up text-teal font-bold uppercase tracking-wide text-sm mb-1">
              Milestone reached!
            </p>

            <h2
              className="milestone-slide-up text-transparent bg-clip-text bg-gradient-to-r from-gold via-coral to-gold milestone-gradient font-extrabold"
              style={{ fontSize: '5.5rem', lineHeight: 1, animationDelay: '0.15s' }}
            >
              {milestoneStreak}
            </h2>
            <p className="milestone-slide-up text-2xl font-bold text-offwhite mb-4" style={{ animationDelay: '0.15s' }}>
              Day Streak
            </p>

            <div className="milestone-slide-up mascot-bubble-standalone mx-auto mb-6" style={{ animationDelay: '0.3s' }}>
              <p key={milestoneBonusLine?.text ?? 'primary'} className="mascot-bubble-line">
                {milestoneBonusLine?.text ?? (MILESTONE_MESSAGES[milestoneStreak] || 'Still going strong!')}
              </p>
            </div>

            <div className="milestone-slide-up" style={{ animationDelay: '0.45s' }}>
              <button
                onClick={handleShareMilestone}
                disabled={shareMilestoneStatus === 'sharing'}
                className="inline-flex items-center gap-2 bg-navy-light/80 backdrop-blur-sm border-2 border-gold hover:bg-gold hover:text-navy-dark text-gold font-bold px-5 py-2.5 rounded-xl transition shadow-gold-glow disabled:opacity-60"
              >
                <Share2 size={16} />
                {shareMilestoneStatus === 'sharing'
                  ? 'Preparing…'
                  : shareMilestoneStatus === 'done'
                  ? 'Shared!'
                  : shareMilestoneStatus === 'error'
                  ? 'Couldn’t share'
                  : 'Share Streak'}
              </button>
            </div>

            <p className="milestone-slide-up text-xs text-offwhite/40 mt-5" style={{ animationDelay: '0.6s' }}>
              Tap anywhere to continue
            </p>
          </div>

          <style>{`
            @keyframes milestone-mascot-pop {
              0% { transform: scale(0) rotate(-180deg); opacity: 0; }
              60% { transform: scale(1.15) rotate(10deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            .milestone-mascot-pop {
              animation: milestone-mascot-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            @keyframes milestone-slide-up {
              0% { transform: translateY(30px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .milestone-slide-up {
              animation: milestone-slide-up 0.5s ease-out forwards;
              opacity: 0;
            }

            @keyframes milestone-gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .milestone-gradient {
              background-size: 200% auto;
              animation: milestone-gradient 3s ease infinite;
            }

            .shadow-gold-glow {
              box-shadow: 0 0 20px rgb(var(--color-gold) / 0.45);
            }

            .mascot-bubble-standalone {
              position: relative;
              background: rgb(var(--color-navy-light) / 0.9);
              border: 1px solid rgb(var(--color-gold) / 0.35);
              border-radius: 14px;
              padding: 0.75rem 1.1rem;
              max-width: 320px;
            }
            .mascot-bubble-standalone p {
              margin: 0;
              font-size: 0.95rem;
              font-weight: 600;
              color: rgb(var(--color-offwhite));
              line-height: 1.4;
            }

            @media (prefers-reduced-motion: reduce) {
              .milestone-mascot-pop,
              .milestone-slide-up,
              .milestone-gradient {
                animation: none;
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {(gameState.gameState.status === 'playing' || gameState.gameState.status === 'solved') && (
        <div
          className="h-dvh bg-navy flex flex-col overflow-hidden"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {stuckNudge && (
            <div
              className="fixed z-[70] stuck-nudge-toast"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
            >
              <MascotNarrator
                lines={[stuckNudge]}
                expression={stuckNudge.expression ?? 'thinking'}
                color="teal"
                size={40}
              />
              <style>{`
                @keyframes stuck-nudge-pop {
                  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.95); }
                  100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
                .stuck-nudge-toast {
                  left: 50%;
                  transform: translateX(-50%);
                  animation: stuck-nudge-pop 0.3s ease-out forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                  .stuck-nudge-toast { animation: none; }
                }
              `}</style>
            </div>
          )}

          <div className="flex-shrink-0 p-2 bg-navy">
            <div className="max-w-2xl mx-auto">
              {/* Home/Menu, title+difficulty, and How to Play share one slim
                  row -- each side button is now icon+label (was icon-only,
                  compensated for with a hover-only Tooltip) since a label
                  visible at a glance beats a tooltip that touch devices
                  can't trigger at all. */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <button
                  onClick={() => { triggerHaptic(15); playSound('click'); handleQuitToHome(); }}
                  aria-label="Quit to home"
                  className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-navy-light border border-navy-dark text-teal hover:text-coral transition"
                >
                  <Home size={16} />
                  <span className="text-[9px] font-semibold leading-none">Home</span>
                </button>

                <div className="flex-1 min-w-0 flex items-baseline justify-center gap-1.5">
                  <h1 className="text-sm font-bold text-offwhite truncate">
                    {currentPuzzle?.title || 'Daily Puzzle'}
                  </h1>
                  <span className="text-[10px] text-teal flex-shrink-0">
                    {currentPuzzle?.difficulty || 'Medium'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic(10);
                    playSound('click');
                    // The auto-shown first-time tutorial already pauses via
                    // the effect below -- this button opens the same
                    // overlay mid-game (to review it again), and needs the
                    // same pause or the puzzle timer keeps running the
                    // whole time it's open. handleTutorialComplete's
                    // resumeGame() is a safe no-op if this is a repeat call.
                    gameState.pauseGame();
                    setShowTutorialOverlay(true);
                  }}
                  aria-label="How to play"
                  className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-teal/20 text-teal border border-teal hover:bg-teal hover:text-navy-dark transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[9px] font-semibold leading-none">Tutorial</span>
                </button>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => { triggerHaptic(10); playSound('click'); setShowGameMenu((v) => !v); }}
                    aria-label="Menu"
                    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-navy-light border border-navy-dark text-teal hover:text-coral transition"
                  >
                    <Menu size={16} />
                    <span className="text-[9px] font-semibold leading-none">Menu</span>
                  </button>
                  {showGameMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowGameMenu(false)} />
                      <div className="absolute right-0 mt-2 w-40 bg-navy-light border border-navy-dark rounded-lg shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => { triggerHaptic(10); playSound('click'); setShowArchive(true); setShowGameMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-offwhite hover:bg-navy-dark transition"
                        >
                          <Calendar size={16} className="text-teal" /> Archive
                        </button>
                        <button
                          onClick={() => { triggerHaptic(10); playSound('click'); setShowPlayerStats(true); setShowGameMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-offwhite hover:bg-navy-dark transition"
                        >
                          <BarChart3 size={16} className="text-teal" /> Stats
                        </button>
                        <button
                          onClick={() => { triggerHaptic(10); playSound('click'); setShowSettings(true); setShowGameMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-offwhite hover:bg-navy-dark transition"
                        >
                          <Settings size={16} className="text-teal" /> Settings
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <div className="text-center bg-navy-light rounded-lg py-1 border border-navy-dark">
                  <div className="text-sm font-bold text-coral leading-tight">{gameState.gameState.moves}</div>
                  <div className="text-[8px] text-teal leading-tight">Moves</div>
                </div>
                <div className="text-center bg-navy-light rounded-lg py-1 border border-navy-dark">
                  <div className="text-sm font-bold text-coral leading-tight">{gameState.gameState.undos}</div>
                  <div className="text-[8px] text-teal leading-tight">Undos</div>
                </div>
                <div className="text-center bg-navy-light rounded-lg py-1 border border-navy-dark">
                  <div className="text-sm font-bold font-mono text-coral leading-tight">{formatTime(gameState.gameState.currentTime)}</div>
                  <div className="text-[8px] text-teal leading-tight">Time</div>
                </div>
                <div className="text-center bg-navy-light rounded-lg py-1 border border-navy-dark">
                  <div className="text-sm font-bold text-teal leading-tight">{Math.round((gameState.gameState.matchingEdges.size / 12) * 100)}%</div>
                  <div className="text-[8px] text-teal leading-tight">Complete</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center py-2">
            <GameBoard
              tiles={gameState.gameState.tiles}
              selectedTile={gameState.gameState.selectedTile}
              matchingEdges={gameState.gameState.matchingEdges}
              onSelectTile={handleSelectTile}
              onRotateTile={handleRotateTile}
              onSwapTiles={handleSwapTiles}
              onUndo={gameState.undoLastMove}
              onShuffle={gameState.shuffleAll}
              onPause={gameState.gameState.isPaused ? gameState.resumeGame : gameState.pauseGame}
              onRestart={gameState.resetGame}
              canUndo={gameState.gameState.moveHistory.length > 0}
              isPaused={gameState.gameState.isPaused}
              zoomLevel={gameState.zoomLevel}
              onZoomIn={() => { triggerHaptic(10); playSound('click'); gameState.zoomIn(); }}
              onZoomOut={() => { triggerHaptic(10); playSound('click'); gameState.zoomOut(); }}
              hintedTileIds={gameState.hintedTileIds}
              previewImageUrl={currentPuzzle?.imageUrl}
              previewGradient={currentPuzzle?.gradient}
            />
          </div>

          {gameState.gameState.isPaused && !showTutorialOverlay && !showPreMatchReveal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-navy-light rounded-2xl p-8 max-w-sm w-full border-2 border-navy-dark">
                <div className="text-center">
                  <div className="w-20 h-20 bg-navy-dark rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-coral">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-coral">
                      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-offwhite mb-2">Game Paused</h2>
                  <p className="text-teal mb-6">Take your time, the timer is stopped</p>

                  <div className="bg-navy-dark rounded-xl p-4 mb-6 border border-navy">
                    <div className="text-offwhite text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-teal">Time:</span>
                        <span className="font-mono font-bold text-coral">
                          {formatTime(gameState.gameState.currentTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-teal">Moves:</span>
                        <span className="font-bold text-coral">{gameState.gameState.moves}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-teal">Progress:</span>
                        <span className="font-bold text-coral">
                          {Math.round((gameState.gameState.matchingEdges.size / 12) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { triggerHaptic(10); playSound('click'); gameState.resumeGame(); }}
                    className="w-full bg-teal hover:bg-teal-dark text-navy font-bold py-4 px-6 rounded-xl mb-3 transition"
                  >
                    Resume Game
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      playSound('click');
                      setHasProcessedCompletion(false);
                      setShowCompletionAnimation(false);
                      gameState.resumeGame();
                      gameState.resetGame();
                    }}
                    className="w-full bg-coral hover:bg-coral-dark text-offwhite font-semibold py-3 px-6 rounded-xl transition"
                  >
                    Quit to Home
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-shrink-0 bg-navy-light/90 backdrop-blur-md px-3 py-2 border-t border-navy-dark">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-2 mb-2">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleHintClick}
                    disabled={gameState.gameState.status !== 'playing' || gameState.gameState.isPaused || hintAdState === 'loading'}
                    className={`flex-1 max-w-[120px] px-2 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1 ${
                      gameState.gameState.status !== 'playing' || gameState.gameState.isPaused
                        ? 'bg-navy-dark/80 text-offwhite/40 cursor-not-allowed border-navy-dark'
                        : 'bg-gold/20 text-gold border-gold hover:bg-gold hover:text-navy-dark'
                    }`}
                  >
                    {hintAdState === 'loading' ? (
                      <>
                        <Film size={13} className="animate-pulse" /> Loading…
                      </>
                    ) : !freeHintUsedThisPuzzle ? (
                      <>
                        <Lightbulb size={13} /> Hint
                      </>
                    ) : extraHints > 0 ? (
                      <>
                        <Lightbulb size={13} /> Hint ({extraHints})
                      </>
                    ) : (
                      <>
                        <Film size={13} /> Hint
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => { triggerHaptic(15); playSound('click'); gameState.undoLastMove(); }}
                    disabled={gameState.gameState.moveHistory.length === 0 || gameState.gameState.status !== 'playing'}
                    className={`flex-1 max-w-[120px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      gameState.gameState.moveHistory.length === 0 || gameState.gameState.status !== 'playing'
                        ? 'bg-navy-dark/80 text-offwhite/40 cursor-not-allowed border border-navy-dark'
                        : 'bg-offwhite text-navy border border-navy-dark hover:border-teal'
                    }`}
                  >
                    Undo
                  </button>

                  <div className="flex justify-center gap-2">
                  <button
                    onClick={() => { triggerHaptic([10, 40, 10]); playSound('click'); gameState.shuffleAll(); }}
                    disabled={gameState.gameState.status !== 'playing'}
                    className={`flex-1 max-w-[120px] px-3 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium ${
                      gameState.gameState.status !== 'playing'
                        ? 'bg-navy-dark/80 text-offwhite/40 cursor-not-allowed border-navy-dark'
                        : 'bg-teal/20 text-teal border-teal hover:bg-teal hover:text-navy-dark'
                    }`}
                  >
                    Shuffle
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      playSound('click');
                      if (gameState.gameState.isPaused) gameState.resumeGame(); else gameState.pauseGame();
                    }}
                    className="flex-1 max-w-[120px] px-3 py-1.5 bg-offwhite text-navy rounded-lg border border-navy-dark hover:border-coral transition-all duration-200 text-xs font-medium"
                  >
                    {gameState.gameState.isPaused ? 'Resume' : 'Pause'}
                  </button>
                </div>
                  <button
                    onClick={() => {
                      // Restart always replays the SAME puzzle in place --
                      // this used to send an already-solved puzzle back to
                      // the home screen instead (via resetGame() +
                      // setCurrentPuzzle(null)), which was the actual bug:
                      // "restart" silently meant "go home" once you'd
                      // already won, discarding the puzzle instead of
                      // replaying it. A solved puzzle has no progress left
                      // to lose, so it skips the confirm a mid-game restart
                      // still needs.
                      const alreadySolved = gameState.gameState.status === 'solved';
                      if (!alreadySolved && !window.confirm('Restart this puzzle? Your progress will be lost.')) {
                        return;
                      }

                      triggerHaptic(alreadySolved ? 15 : 20);
                      playSound('click');
                      setHasProcessedCompletion(false);
                      setShowCompletionAnimation(false);
                      // Restarting reuses the same puzzle object directly
                      // (not handleStartPuzzle), so this flag never got
                      // reset -- the auto-trigger effect's
                      // !hasShownTutorialForCurrentPuzzle guard silently
                      // skipped the pause+reveal+countdown on restart.
                      // Resetting it here lets that same effect fire
                      // again (tutorial's already done, so it goes
                      // straight to the reveal) once status flips back
                      // to 'playing'.
                      setHasShownTutorialForCurrentPuzzle(false);
                      setFreeHintUsedThisPuzzle(false);
                      gameState.startGame(currentPuzzle);
                    }}
                    className="flex-1 max-w-[120px] px-3 py-1.5 bg-coral/20 text-coral rounded-lg border border-coral hover:bg-coral hover:text-navy-dark transition-all duration-200 text-xs font-medium"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;