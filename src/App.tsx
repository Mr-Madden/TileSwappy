import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Calendar, Settings, BarChart3 } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { StartScreen } from './components/screens/StartScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { GameBoard } from './components/game/GameBoard';
import { TileSwappyLogo } from './components/TileSwappyLogo/TileSwappyLogo';
import { DEFAULT_THEME } from './theme/themes';

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
  DAILY_PUZZLES: 'tileswappy_daily_puzzles'
};

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
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [hasShownTutorialForCurrentPuzzle, setHasShownTutorialForCurrentPuzzle] = useState(false);
  
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
  const [settings, setSettings] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SETTINGS, {
      selectedLanguage: 'English',
      language: 'English',
      notificationsEnabled: true,
      vibrateEnabled: true,
      soundEnabled: true,
      theme: DEFAULT_THEME
    })
  );
  const [dailyPuzzles, setDailyPuzzles] = useState<Record<string, any>>(() => 
    loadFromStorage(STORAGE_KEYS.DAILY_PUZZLES, {})
  );
  
  const gameState = useGameState();

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
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || DEFAULT_THEME);
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
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      
      if (!tutorialCompleted) {
        gameState.pauseGame();
        setShowTutorialOverlay(true);
      }
      
      setHasShownTutorialForCurrentPuzzle(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameState.status, hasShownTutorialForCurrentPuzzle]);

  const handleTutorialComplete = () => {
    setShowTutorialOverlay(false);
    gameState.resumeGame();
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
  setNewBests({ time: false, moves: false, swaps: false });

  // Set current puzzle
  setCurrentPuzzleDate(dateToUse);
  setCurrentPuzzle(normalizedPuzzle);

  // Start the game
  gameState.startGame(normalizedPuzzle);
};



  const handleTileInteraction = (tileId: string, deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      const direction = deltaX > 0 ? -1 : 1;
      gameState.rotateTile(tileId, direction > 0 ? 270 : 90);
    } else if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      if (gameState.gameState.selectedTile === null) {
        gameState.selectTile(tileId);
      } else if (gameState.gameState.selectedTile === tileId) {
        gameState.selectTile(null);
      } else {
        gameState.swapTiles(gameState.gameState.selectedTile, tileId);
      }
    }
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

  useEffect(() => {
    if (gameState.gameState.status === 'solved' && !hasProcessedCompletion) {
      setHasProcessedCompletion(true);
      setShowCompletionAnimation(true);
      setTotalGamesPlayed(prev => prev + 1);
      
      const puzzleKey = currentPuzzle?.date || currentPuzzleDate || 'today';
      const puzzleTitle = currentPuzzle?.title || null;
      
      setCompletedPuzzleIds(prev => new Set([...prev, puzzleKey]));
      
      const isAdminPuzzle = currentPuzzle?.imageUrl || currentPuzzle?.image_url || currentPuzzle?.fromDatabase;
      if (isAdminPuzzle) {
        setCompletedDates(prev => new Set([...prev, currentPuzzleDate]));
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
          puzzleTitle: null
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
            puzzleTitle: puzzleTitle || currentStats.puzzleTitle
          }
        };
      });

      setTimeout(() => {
        setShowCompletionAnimation(false);
        setShowStreak(true);
      }, 4000);
    }
  }, [gameState.gameState.status, gameState.gameState.solveTime, gameState.gameState.moves, gameState.gameState.swaps, hasProcessedCompletion, currentPuzzle, currentPuzzleDate]);

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
      <TileSwappyLogo size={150} bouncing />
      
      {gameState.gameState.status === 'start' && (
        <StartScreen onStart={gameState.dismissStartScreen} />
      )}

      {gameState.gameState.status === 'idle' && (
        <HomeScreen
          onStartPuzzle={(puzzle) => handleStartPuzzle(puzzle)}
          onOpenArchive={() => setShowArchive(true)}
          onOpenStreak={() => setShowStreak(true)}
          onOpenStats={() => setShowPlayerStats(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenTutorial={() => setShowTutorialOverlay(true)}
        />
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
          />
        </Suspense>
      )}

      {showStreak && (
        <Suspense fallback={<ModalLoader />}>
          <StreakModal
            onClose={() => setShowStreak(false)}
            completedDates={completedDates}
            onDateSelect={(dateStr, puzzleData) => handleDateSelect(dateStr, puzzleData)}
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

      {showCompletionAnimation && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(newBests.time || newBests.moves || newBests.swaps ? 90 : 55)].map((_, i) => {
              const shape = ['circle', 'square', 'diamond'][i % 3];
              const size = 8 + Math.floor(Math.random() * 8);
              const color = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C77DFF'][Math.floor(Math.random() * 5)];
              return (
                <div
                  key={i}
                  className={`absolute animate-confetti ${shape === 'circle' ? 'rounded-full' : shape === 'diamond' ? 'rotate-45' : ''}`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-20px',
                    width: size,
                    height: size,
                    backgroundColor: color,
                    animationDelay: `${Math.random() * 0.6}s`,
                    animationDuration: `${1.8 + Math.random() * 2.2}s`
                  }}
                />
              );
            })}
          </div>

          <div className="text-center relative z-10">
            <div className="mb-6 animate-bounce-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-teal/30 rounded-full blur-2xl animate-pulse"></div>
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
                <div className="relative text-9xl animate-wiggle">
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
          </div>

          <style>{`
            @keyframes confetti {
              0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
              }
            }

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

            @keyframes wiggle {
              0%, 100% { transform: rotate(-5deg); }
              50% { transform: rotate(5deg); }
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

            .animate-confetti {
              animation: confetti linear forwards;
            }

            .animate-bounce-in {
              animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .animate-slide-up {
              animation: slide-up 0.5s ease-out forwards;
              opacity: 0;
            }

            .animate-wiggle {
              animation: wiggle 1s ease-in-out infinite;
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
              box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
            }

            .shadow-teal-glow {
              box-shadow: 0 0 20px rgba(78, 205, 196, 0.4);
            }
          `}</style>
        </div>
      )}

      {(gameState.gameState.status === 'playing' || gameState.gameState.status === 'solved') && (
        <div className="min-h-screen bg-navy flex flex-col">
          <div className="flex-shrink-0 p-3 bg-navy">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-bold text-offwhite">
                  {currentPuzzle?.title || 'Daily Puzzle'}
                </h1>
                <div className="text-xs text-teal">
                  {currentPuzzle?.difficulty || 'Medium'}
                </div>
              </div>
              
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => setShowTutorialOverlay(true)}
                  className="px-4 py-2 bg-teal/20 text-teal rounded-lg border border-teal hover:bg-teal hover:text-navy-dark transition-all duration-200 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to Play
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-navy-light rounded-lg py-1.5 border border-navy-dark">
                  <div className="text-base font-bold text-coral">{gameState.gameState.moves}</div>
                  <div className="text-[9px] text-teal">Moves</div>
                </div>
                <div className="text-center bg-navy-light rounded-lg py-1.5 border border-navy-dark">
                  <div className="text-base font-bold text-coral">{gameState.gameState.undos}</div>
                  <div className="text-[9px] text-teal">Undos</div>
                </div>
                <div className="text-center bg-navy-light rounded-lg py-1.5 border border-navy-dark">
                  <div className="text-base font-bold font-mono text-coral">{formatTime(gameState.gameState.currentTime)}</div>
                  <div className="text-[9px] text-teal">Time</div>
                </div>
                <div className="text-center bg-navy-light rounded-lg py-1.5 border border-navy-dark">
                  <div className="text-base font-bold text-teal">{Math.round((gameState.gameState.matchingEdges.size / 12) * 100)}%</div>
                  <div className="text-[9px] text-teal">Complete</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-2">
            <GameBoard
              tiles={gameState.gameState.tiles}
              selectedTile={gameState.gameState.selectedTile}
              matchingEdges={gameState.gameState.matchingEdges}
              onTileInteraction={handleTileInteraction}
              onUndo={gameState.undoLastMove}
              onShuffle={gameState.shuffleAll}
              onPause={gameState.gameState.isPaused ? gameState.resumeGame : gameState.pauseGame}
              onRestart={gameState.resetGame}
              canUndo={gameState.gameState.moveHistory.length > 0}
              isPaused={gameState.gameState.isPaused}
              zoomLevel={gameState.zoomLevel}
              onZoomIn={gameState.zoomIn}
              onZoomOut={gameState.zoomOut}
            />
          </div>

          {gameState.gameState.isPaused && !showTutorialOverlay && (
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
                    onClick={gameState.resumeGame}
                    className="w-full bg-teal hover:bg-teal-dark text-navy font-bold py-4 px-6 rounded-xl mb-3 transition"
                  >
                    Resume Game
                  </button>

                  <button
                    onClick={() => {
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
                    onClick={gameState.undoLastMove}
                    disabled={gameState.gameState.moveHistory.length === 0}
                    className={`flex-1 max-w-[120px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      gameState.gameState.moveHistory.length === 0
                        ? 'bg-navy-dark/80 text-gray-500 cursor-not-allowed border border-navy-dark'
                        : 'bg-offwhite text-navy-lightest border border-navy-dark hover:border-teal'
                    }`}
                  >
                    Undo
                  </button>
                  
                  <div className="flex justify-center gap-2">
                  <button
                    onClick={gameState.shuffleAll}
                    className="flex-1 max-w-[120px] px-3 py-1.5 bg-teal/20 text-teal rounded-lg border border-teal hover:bg-teal hover:text-navy-dark transition-all duration-200 text-xs font-medium"
                  >
                    Shuffle
                  </button>
                  
                  <button
                    onClick={gameState.gameState.isPaused ? gameState.resumeGame : gameState.pauseGame}
                    className="flex-1 max-w-[120px] px-3 py-1.5 bg-offwhite text-navy-lightest rounded-lg border border-navy-dark hover:border-coral transition-all duration-200 text-xs font-medium"
                  >
                    {gameState.gameState.isPaused ? 'Resume' : 'Pause'}
                  </button>
                </div>
                  <button
                    onClick={() => {
                      if (gameState.gameState.status === 'solved') {
                        setCurrentPuzzle(null);
                        setHasProcessedCompletion(false);
                        setShowCompletionAnimation(false);
                        gameState.resetGame();
                      } else {
                        if (window.confirm('Restart this puzzle? Your progress will be lost.')) {
                          setHasProcessedCompletion(false);
                          setShowCompletionAnimation(false);
                          gameState.startGame(currentPuzzle);
                        }
                      }
                    }}
                    className="flex-1 max-w-[120px] px-3 py-1.5 bg-coral/20 text-coral rounded-lg border border-coral hover:bg-coral hover:text-white transition-all duration-200 text-xs font-medium"
                  >
                    Restart
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-6 pt-2 border-t border-navy-dark/50">
                <button
                  onClick={() => setShowArchive(true)}
                  className="flex flex-col items-center gap-0.5 text-teal hover:text-coral transition"
                >
                  <Calendar size={20} />
                  <span className="text-[12px]">Archive</span>
                </button>

                <button
                  onClick={() => setShowPlayerStats(true)}
                  className="flex flex-col items-center gap-0.5 text-teal hover:text-coral transition"
                >
                  <BarChart3 size={20} />
                  <span className="text-[12px]">Stats</span>
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="flex flex-col items-center gap-0.5 text-teal hover:text-coral transition"
                >
                  <Settings size={20} />
                  <span className="text-[12px]">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;