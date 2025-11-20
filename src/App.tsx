import React, { useState, useEffect } from 'react';
import { RotateCw, Calendar, Settings, BarChart3 } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { StartScreen } from './components/screens/StartScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { GameBoard } from './components/game/GameBoard';
import { ArchiveModal } from './components/modals/ArchiveModal';
import { SettingsModal } from './components/modals/SettingModal';
import { PlayerStatsModal } from './components/modals/PlayerStatsModal';
import { StreakModal } from './components/modals/StreakModal';

// Local Storage Keys
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

// Load from localStorage with default value
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Save to localStorage
const saveToStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

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
  
  // Load state from localStorage on mount
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
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(() => 
    loadFromStorage(STORAGE_KEYS.TOTAL_GAMES, 0)
  );
  const [settings, setSettings] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SETTINGS, {
      selectedLanguage: 'English',
      language: 'English',
      notificationsEnabled: true,
      vibrateEnabled: true,
      soundEnabled: true
    })
  );
  const [dailyPuzzles, setDailyPuzzles] = useState<Record<string, any>>(() => 
    loadFromStorage(STORAGE_KEYS.DAILY_PUZZLES, {})
  );
  
  const gameState = useGameState();
  
  // Save to localStorage whenever state changes
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
    saveToStorage(STORAGE_KEYS.DAILY_PUZZLES, dailyPuzzles);
  }, [dailyPuzzles]);

  const handleStartPuzzle = (puzzle?: any, puzzleDate?: string) => {
    console.log('🎮 App.tsx: Starting puzzle with:', puzzle);
    
    // Normalize the puzzle data - convert image_url to imageUrl if needed
    let normalizedPuzzle = puzzle;
    if (puzzle?.image_url && !puzzle?.imageUrl) {
      normalizedPuzzle = {
        ...puzzle,
        imageUrl: puzzle.image_url
      };
      console.log('🔄 Normalized puzzle data:', normalizedPuzzle);
    }
    
    // Reset completion flags
    setHasProcessedCompletion(false);
    setShowCompletionAnimation(false);
    
    // Use provided date or default to today
    const dateToUse = puzzleDate || new Date().toISOString().split('T')[0];
    setCurrentPuzzleDate(dateToUse);
    
    // Store this puzzle with the date
    if (normalizedPuzzle) {
      setDailyPuzzles(prev => ({
        ...prev,
        [dateToUse]: normalizedPuzzle
      }));
    }
    
    setCurrentPuzzle(normalizedPuzzle);
    gameState.startGame(normalizedPuzzle);
  };

  const handleTileInteraction = (tileId: string, deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      const direction = deltaX > 0 ? 1 : -1;
      gameState.rotateTile(tileId, direction);
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
    console.log('🗓️ Selected date:', dateStr);
    console.log('📦 Puzzle data received:', puzzleData);
    
    // If we have puzzle data from the calendar, use it directly
    if (puzzleData) {
      console.log('✅ Using puzzle data from calendar');
      handleStartPuzzle(puzzleData, dateStr);
    } else {
      // Fallback: check if we have a puzzle stored locally for this date
      const puzzleForDate = dailyPuzzles[dateStr];
      
      if (puzzleForDate) {
        console.log('📦 Found puzzle in local storage for date:', puzzleForDate);
        handleStartPuzzle(puzzleForDate, dateStr);
      } else {
        console.log('⚠️ No puzzle found for date, using default');
        handleStartPuzzle(undefined, dateStr);
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

  // Handle puzzle completion - ENHANCED WITH DEBUG LOGS
  // In App.tsx, update the puzzle completion useEffect
// In App.tsx, find the puzzle completion useEffect and update it:

useEffect(() => {
  console.log('🔍 Completion Check - Status:', gameState.gameState.status, 'HasProcessed:', hasProcessedCompletion);
  
  if (gameState.gameState.status === 'solved' && !hasProcessedCompletion) {
    console.log('🎉 CELEBRATION TRIGGERED! Showing animation');
    console.log('📊 Stats - Moves:', gameState.gameState.moves, 'Swaps:', gameState.gameState.swaps, 'Time:', gameState.gameState.solveTime);
    
    setHasProcessedCompletion(true);
    setShowCompletionAnimation(true);
    setTotalGamesPlayed(prev => prev + 1);
    
    // Use date as the key instead of ID - this is the fix!
    const puzzleKey = currentPuzzle?.date || currentPuzzleDate || 'today';
    const puzzleTitle = currentPuzzle?.title || null;
    
    console.log('🔑 Using puzzle key:', puzzleKey);
    console.log('📝 Puzzle title:', puzzleTitle);
    
    setCompletedPuzzleIds(prev => new Set([...prev, puzzleKey]));
    
    // Only add to completedDates if this is an admin-uploaded puzzle
    const isAdminPuzzle = currentPuzzle?.imageUrl || currentPuzzle?.image_url || currentPuzzle?.fromDatabase;
    if (isAdminPuzzle) {
      console.log('📅 Adding admin puzzle to streak calendar:', currentPuzzleDate);
      setCompletedDates(prev => new Set([...prev, currentPuzzleDate]));
    } else {
      console.log('⏭️ Skipping randomly generated puzzle for streak calendar');
    }
    
    // Update puzzle stats with date as key and title stored
    setPuzzleStats(prev => {
      const currentStats = prev[puzzleKey] || {
        attempts: 0,
        bestTime: null,
        bestMoves: null,
        bestSwaps: null,
        completionDates: [],
        puzzleTitle: null
      };
      
      const finalTime = gameState.gameState.solveTime || 0;
      const isNewBest = !currentStats.bestTime || finalTime < currentStats.bestTime;
      
      return {
        ...prev,
        [puzzleKey]: {
          attempts: currentStats.attempts + 1,
          bestTime: isNewBest ? finalTime : currentStats.bestTime,
          bestMoves: isNewBest ? gameState.gameState.moves : currentStats.bestMoves,
          bestSwaps: isNewBest ? gameState.gameState.swaps : currentStats.bestSwaps,
          lastPlayedTime: finalTime,
          lastPlayedMoves: gameState.gameState.moves,
          lastPlayedSwaps: gameState.gameState.swaps,
          completionDates: [...currentStats.completionDates, new Date().toISOString()],
          puzzleTitle: puzzleTitle || currentStats.puzzleTitle // Store the title from the puzzle
        }
      };
    });
    
    // Show streak modal after celebration
    setTimeout(() => {
      console.log('⏰ Celebration timeout complete, transitioning to streak modal');
      setShowCompletionAnimation(false);
      setShowStreak(true);
    }, 4000);
  }
}, [gameState.gameState.status, gameState.gameState.solveTime, gameState.gameState.moves, gameState.gameState.swaps, hasProcessedCompletion, currentPuzzle, currentPuzzleDate]);

// Add this useEffect right after all your state declarations in App.tsx
// This will clean up old UUID-based stats and migrate them if possible
useEffect(() => {
  const cleanupOldStats = () => {
    const stats = loadFromStorage(STORAGE_KEYS.PUZZLE_STATS, {});
    let needsCleanup = false;
    const cleanedStats: Record<string, any> = {};
    
    Object.entries(stats).forEach(([key, value]) => {
      // Check if key is a UUID (long alphanumeric with hyphens)
      const isUUID = key.length > 30 && key.includes('-');
      
      if (isUUID) {
        console.log('🧹 Found old UUID-based stat:', key);
        needsCleanup = true;
        // Don't copy UUID-based stats to cleaned version
      } else {
        // Keep date-based or "today" stats
        cleanedStats[key] = value;
      }
    });
    
    if (needsCleanup) {
      console.log('🧹 Cleaning up old stats...');
      console.log('📊 Old stats count:', Object.keys(stats).length);
      console.log('📊 New stats count:', Object.keys(cleanedStats).length);
      setPuzzleStats(cleanedStats);
      saveToStorage(STORAGE_KEYS.PUZZLE_STATS, cleanedStats);
      console.log('✅ Cleanup complete!');
    }
  };
  
  cleanupOldStats();
}, []); // Run once on mount

  return (
    <div className="min-h-screen bg-navy">
      {/* Start Screen - Shows once on first launch */}
      {gameState.gameState.status === 'start' && (
        <StartScreen onStart={gameState.dismissStartScreen} />
      )}

      {/* Home Screen - Only show when idle (not playing/solved) */}
      {gameState.gameState.status === 'idle' && (
        <HomeScreen
          onStartPuzzle={(puzzle) => handleStartPuzzle(puzzle)}
          onOpenArchive={() => setShowArchive(true)}
          onOpenStreak={() => setShowStreak(true)}
          onOpenStats={() => setShowPlayerStats(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Modals */}
      {showArchive && (
        <ArchiveModal
          onClose={() => setShowArchive(false)}
          completedPuzzleIds={completedPuzzleIds}
          favoritePuzzleIds={favoritePuzzleIds}
          onToggleFavorite={handleToggleFavorite}
          onStartPuzzle={(puzzle) => handleStartPuzzle(puzzle)}
        />
      )}

      {showPlayerStats && (
        <PlayerStatsModal
          onClose={() => setShowPlayerStats(false)}
          puzzleStats={puzzleStats}
          totalGamesPlayed={totalGamesPlayed}
        />
      )}

      {showStreak && (
        <StreakModal
          onClose={() => setShowStreak(false)}
          completedDates={completedDates}
          onDateSelect={(dateStr, puzzleData) => handleDateSelect(dateStr, puzzleData)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        />
      )}

      {/* Enhanced Completion Animation with Celebration */}
      {showCompletionAnimation && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center overflow-hidden">
          {/* Animated Confetti Background */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'][Math.floor(Math.random() * 4)],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Main Celebration Content */}
          <div className="text-center relative z-10">
            {/* Trophy Icon with Glow */}
            <div className="mb-6 animate-bounce-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-teal/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative text-9xl animate-wiggle">
                  🏆
                </div>
              </div>
            </div>

            {/* Success Text */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal via-coral to-teal mb-4 animate-gradient">
                Puzzle Solved!
              </h2>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4 justify-center mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="bg-navy-light/80 backdrop-blur-sm border-2 border-coral rounded-xl px-6 py-3 shadow-coral-glow">
                <div className="text-3xl font-bold text-coral">
                  {gameState.gameState.moves}
                </div>
                <div className="text-xs text-teal font-semibold">Moves</div>
              </div>
              
              <div className="bg-navy-light/80 backdrop-blur-sm border-2 border-teal rounded-xl px-6 py-3 shadow-teal-glow">
                <div className="text-3xl font-bold text-teal">
                  {gameState.gameState.swaps}
                </div>
                <div className="text-xs text-offwhite font-semibold">Swaps</div>
              </div>
              
              <div className="bg-navy-light/80 backdrop-blur-sm border-2 border-coral rounded-xl px-6 py-3 shadow-coral-glow">
                <div className="text-2xl font-bold font-mono text-coral">
                  {formatTime(gameState.gameState.solveTime || 0)}
                </div>
                <div className="text-xs text-teal font-semibold">Time</div>
              </div>
            </div>

            {/* Encouraging Message */}
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <p className="text-xl text-offwhite font-semibold">
                {gameState.gameState.moves < 20 ? '🌟 Amazing!' : 
                 gameState.gameState.moves < 30 ? '✨ Well Done!' : 
                 '🎯 Great Job!'}
              </p>
            </div>
          </div>

          {/* Particle Effects and Animations */}
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

            .shadow-coral-glow {
              box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
            }

            .shadow-teal-glow {
              box-shadow: 0 0 20px rgba(78, 205, 196, 0.4);
            }
          `}</style>
        </div>
      )}

      {/* Game View - Only show when playing or solved */}
      {(gameState.gameState.status === 'playing' || gameState.gameState.status === 'solved') && (
        <div className="min-h-screen bg-navy p-4 pb-24">
          {/* Header */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-offwhite">
                {currentPuzzle?.title || 'Daily Puzzle'}
              </h1>
              <div className="text-xs text-teal">
                {currentPuzzle?.difficulty || 'Medium'}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="max-w-md mx-auto grid grid-cols-3 gap-2 mb-4">
            <div className="text-center bg-navy-light rounded-lg py-2 border border-navy-dark">
              <div className="text-lg font-bold text-coral">
                {gameState.gameState.moves}
              </div>
              <div className="text-[10px] text-teal">Moves</div>
            </div>
            <div className="text-center bg-navy-light rounded-lg py-2 border border-navy-dark">
              <div className="text-lg font-bold text-coral">
                {gameState.gameState.undos}
              </div>
              <div className="text-[10px] text-teal">Undos</div>
            </div>
            <div className="text-center bg-navy-light rounded-lg py-2 border border-navy-dark">
              <div className="text-lg font-bold font-mono text-coral">
                {formatTime(gameState.gameState.currentTime)}
              </div>
              <div className="text-[10px] text-teal">Time</div>
            </div>
          </div>

          {/* Progress */}
          <div className="text-center mb-4">
            <div className="bg-navy-light rounded-lg py-2 max-w-24 mx-auto border border-navy-dark">
              <div className="text-lg font-bold text-teal">
                {Math.round((gameState.gameState.matchingEdges.size / 12) * 100)}%
              </div>
              <div className="text-[10px] text-offwhite">Complete</div>
            </div>
          </div>

          {/* Instructions */}
          {gameState.gameState.status === 'playing' && (
            <div className="text-center mb-4">
              <p className="text-teal text-xs">
                Drag tiles left/right to rotate • Click two tiles to swap
              </p>
            </div>
          )}

          {/* Success Message */}
          {gameState.gameState.status === 'solved' && (
            <div className="text-center mb-4">
              <div className="bg-teal text-navy px-4 py-3 rounded-xl mx-auto inline-block shadow-teal-glow">
                <div className="flex items-center gap-2 text-lg font-bold mb-1">
                  🎉 Puzzle Solved!
                </div>
                <div className="text-xs font-semibold">
                  {gameState.gameState.moves} moves • {gameState.gameState.swaps} swaps •{' '}
                  {formatTime(gameState.gameState.solveTime || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Game Board */}
          <GameBoard
            tiles={gameState.gameState.tiles}
            selectedTile={gameState.gameState.selectedTile}
            matchingEdges={gameState.gameState.matchingEdges}
            onTileInteraction={handleTileInteraction}
          />

          {/* Controls */}
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {gameState.gameState.status === 'playing' && (
              <>
                <button
                  onClick={gameState.undoLastMove}
                  disabled={gameState.gameState.moveHistory.length === 0}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    gameState.gameState.moveHistory.length === 0
                      ? 'bg-navy-dark text-gray-500 cursor-not-allowed border border-navy-light'
                      : 'bg-coral hover:bg-coral-dark text-offwhite'
                  }`}
                >
                  Undo
                </button>

                <button 
                  onClick={gameState.shuffleAll} 
                  className="bg-teal hover:bg-teal-dark text-navy px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Shuffle
                </button>

                <button 
                  onClick={gameState.pauseGame} 
                  className="bg-navy-light hover:bg-navy-dark text-offwhite px-4 py-2.5 rounded-xl text-sm font-semibold transition border border-navy-dark"
                >
                  Pause
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (gameState.gameState.status === 'solved') {
                  setCurrentPuzzle(null);
                  setHasProcessedCompletion(false);
                  setShowCompletionAnimation(false);
                  gameState.resetGame();
                } else {
                  if (window.confirm('Restart this puzzle? Your progress will be lost.')) {
                    console.log('🔄 Restarting with puzzle:', currentPuzzle);
                    setHasProcessedCompletion(false);
                    setShowCompletionAnimation(false);
                    gameState.startGame(currentPuzzle);
                  }
                }
              }}
              className="bg-coral hover:bg-coral-dark text-offwhite px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition"
            >
              <RotateCw size={16} />
              {gameState.gameState.status === 'solved' ? 'Back to Home' : 'Restart'}
            </button>
          </div>

          {/* Pause Modal */}
          {gameState.gameState.isPaused && (
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

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-navy-light/90 backdrop-blur-md px-4 py-3 border-t border-navy-dark">
            <div className="flex justify-center gap-6 max-w-md mx-auto">
              <button
                onClick={() => setShowArchive(true)}
                className="flex flex-col items-center gap-1 text-teal hover:text-coral transition"
              >
                <Calendar size={22} />
                <span className="text-[10px]">Archive</span>
              </button>

              <button
                onClick={() => setShowPlayerStats(true)}
                className="flex flex-col items-center gap-1 text-teal hover:text-coral transition"
              >
                <BarChart3 size={22} />
                <span className="text-[10px]">Stats</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="flex flex-col items-center gap-1 text-teal hover:text-coral transition"
              >
                <Settings size={22} />
                <span className="text-[10px]">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;