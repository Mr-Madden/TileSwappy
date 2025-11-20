import React, { useState } from 'react';
import { X, TrendingUp, Trophy, Target, Clock } from 'lucide-react';

interface PlayerStatsModalProps {
  onClose: () => void;
  puzzleStats: Record<string, any>;
  totalGamesPlayed: number;
}

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  onClose,
  puzzleStats,
  totalGamesPlayed
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details'>('overview');

  // Add debug logging
  console.log('📊 PlayerStatsModal - puzzleStats:', puzzleStats);
  console.log('📊 PlayerStatsModal - stats keys:', Object.keys(puzzleStats));

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

  // Get puzzle title from puzzleId
  const getPuzzleTitle = (puzzleId: string, stats: any): string => {
    console.log('🎯 getPuzzleTitle called with:', puzzleId, stats);
    
    // PRIORITY 1: If the stats object has a puzzleTitle field, use it
    if (stats.puzzleTitle) {
      console.log('✅ Using stored puzzleTitle:', stats.puzzleTitle);
      return stats.puzzleTitle;
    }
    
    // PRIORITY 2: If puzzleId looks like a date (YYYY-MM-DD)
    if (puzzleId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(puzzleId + 'T00:00:00'); // Add time to avoid timezone issues
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      console.log('📅 Formatted date:', formatted);
      return formatted;
    }
    
    // PRIORITY 3: If it's just "today"
    if (puzzleId === 'today') {
      return "Today's Puzzle";
    }
    
    // PRIORITY 4: Make readable from ID
    const readable = puzzleId
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    console.log('📝 Readable title:', readable);
    return readable;
  };

  // Calculate overview stats
  const totalAttempts = Object.values(puzzleStats).reduce((sum: number, stats: any) => sum + stats.attempts, 0);
  const completedPuzzles = Object.keys(puzzleStats).length;
  const averageMoves = completedPuzzles > 0
    ? Math.round(Object.values(puzzleStats).reduce((sum: number, stats: any) => sum + (stats.bestMoves || 0), 0) / completedPuzzles)
    : 0;
  const averageTime = completedPuzzles > 0
    ? Object.values(puzzleStats).reduce((sum: number, stats: any) => sum + (stats.bestTime || 0), 0) / completedPuzzles
    : 0;

  // Get best performances
  const bestTime = Math.min(...Object.values(puzzleStats).map((stats: any) => stats.bestTime || Infinity));
  const bestMoves = Math.min(...Object.values(puzzleStats).map((stats: any) => stats.bestMoves || Infinity));

  // Sort puzzles by best time for leaderboard
  const sortedByTime = Object.entries(puzzleStats)
    .filter(([_, stats]) => stats.bestTime)
    .sort((a, b) => a[1].bestTime - b[1].bestTime);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-light rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-black/30 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-coral" />
              Your Stats
            </h2>
            <p className="text-sm text-blue-200">Track your puzzle-solving journey</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-3 text-sm font-semibold transition relative ${
              selectedTab === 'overview'
                ? 'text-teal'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Overview
            {selectedTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal"></div>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('details')}
            className={`px-4 py-3 text-sm font-semibold transition relative ${
              selectedTab === 'details'
                ? 'text-teal'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Puzzle Details
            {selectedTab === 'details' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {selectedTab === 'overview' ? (
            <div className="space-y-6">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-teal mb-1">{totalGamesPlayed}</div>
                  <div className="text-xs text-white/60">Total Games</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-coral mb-1">{completedPuzzles}</div>
                  <div className="text-xs text-white/60">Puzzles Solved</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-teal mb-1">{averageMoves}</div>
                  <div className="text-xs text-white/60">Avg Moves</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-mono text-coral mb-1">
                    {formatTime(averageTime)}
                  </div>
                  <div className="text-xs text-white/60">Avg Time</div>
                </div>
              </div>

              {/* Personal Bests */}
              <div className="bg-black/20 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="text-coral" size={20} />
                  Personal Bests
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-navy-dark/50 rounded-lg p-3">
                    <div className="text-xs text-teal mb-1">Fastest Time</div>
                    <div className="text-xl font-bold font-mono text-white">
                      {bestTime !== Infinity ? formatTime(bestTime) : '--'}
                    </div>
                  </div>
                  <div className="bg-navy-dark/50 rounded-lg p-3">
                    <div className="text-xs text-teal mb-1">Fewest Moves</div>
                    <div className="text-xl font-bold text-white">
                      {bestMoves !== Infinity ? bestMoves : '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performances */}
              <div className="bg-black/20 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="text-teal" size={20} />
                  Top Performances
                </h3>
                <div className="space-y-2">
                  {sortedByTime.slice(0, 5).map(([puzzleId, stats], index) => (
                    <div
                      key={puzzleId}
                      className="bg-navy-dark/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-navy' :
                          index === 1 ? 'bg-gray-400 text-navy' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-navy-light text-white/60'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {getPuzzleTitle(puzzleId, stats)}
                          </div>
                          <div className="text-xs text-white/60">
                            {stats.bestMoves} moves
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-coral">
                          {formatTime(stats.bestTime)}
                        </div>
                        <div className="text-xs text-white/60">
                          {stats.attempts}x played
                        </div>
                      </div>
                    </div>
                  ))}
                  {sortedByTime.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No puzzles completed yet</p>
                      <p className="text-xs mt-1">Start solving to see your stats!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(puzzleStats).length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Trophy size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-semibold mb-1">No puzzles completed yet</p>
                  <p className="text-sm">Complete your first puzzle to see detailed statistics!</p>
                </div>
              ) : (
                Object.entries(puzzleStats)
                  .sort((a, b) => {
                    // Sort by most recent completion
                    const aLastDate = a[1].completionDates?.[a[1].completionDates.length - 1] || '';
                    const bLastDate = b[1].completionDates?.[b[1].completionDates.length - 1] || '';
                    return bLastDate.localeCompare(aLastDate);
                  })
                  .map(([puzzleId, stats]) => (
                    <div
                      key={puzzleId}
                      className="bg-black/20 rounded-xl p-4 hover:bg-black/30 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {getPuzzleTitle(puzzleId, stats)}
                          </h4>
                          <p className="text-xs text-white/60">
                            Played {stats.attempts} {stats.attempts === 1 ? 'time' : 'times'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-teal mb-1">Best Time</div>
                          <div className="text-lg font-bold font-mono text-coral">
                            {formatTime(stats.bestTime)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-navy-dark/50 rounded-lg p-2 text-center">
                          <div className="text-xs text-white/60 mb-1">Best Moves</div>
                          <div className="text-lg font-bold text-teal">{stats.bestMoves}</div>
                        </div>
                        <div className="bg-navy-dark/50 rounded-lg p-2 text-center">
                          <div className="text-xs text-white/60 mb-1">Best Swaps</div>
                          <div className="text-lg font-bold text-teal">{stats.bestSwaps}</div>
                        </div>
                        <div className="bg-navy-dark/50 rounded-lg p-2 text-center">
                          <div className="text-xs text-white/60 mb-1">Attempts</div>
                          <div className="text-lg font-bold text-teal">{stats.attempts}</div>
                        </div>
                      </div>

                      {stats.lastPlayedTime && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-white/60 mb-2">Last Played</div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/80">
                              {formatTime(stats.lastPlayedTime)}
                            </span>
                            <span className="text-white/60">
                              {stats.lastPlayedMoves} moves • {stats.lastPlayedSwaps} swaps
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-offwhite font-bold py-3 px-6 rounded-xl transition shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};