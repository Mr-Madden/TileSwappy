import React, { useState } from 'react';
import { TrendingUp, Trophy, Target, Clock, Activity, Share2, Flame } from 'lucide-react';
import { ModalShell } from '../common/ModalShell';
import { TileSwappyLogo } from '../TileSwappyLogo/TileSwappyLogo';
import { calculateCurrentStreak } from '../../utils/streaks';
import { getCurrentDate } from '../../utils/helpers';

interface PlayerStatsModalProps {
  onClose: () => void;
  puzzleStats: Record<string, any>;
  totalGamesPlayed: number;
  completedDates?: Set<string>;
  frozenDates?: Set<string>;
}

// Local-time YYYY-MM-DD, matching utils/helpers.ts's getCurrentDate --
// completionDates are stored as UTC ISO timestamps, but activity should
// bucket by the day the player actually experienced.
const localDayKey = (iso: string): string => {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  onClose,
  puzzleStats,
  totalGamesPlayed,
  completedDates,
  frozenDates
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details'>('overview');
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'done' | 'error'>('idle');

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

  // Mirrors StreakModal's renderPuzzleThumbnail -- real image if this
  // was a photo puzzle, else the same gradient the puzzle was actually
  // generated from, else a generic placeholder for older entries saved
  // before puzzleImageUrl/puzzleGradient started being captured.
  const renderPuzzleThumbnail = (stats: any) => {
    if (stats.puzzleImageUrl) {
      return <img src={stats.puzzleImageUrl} alt="" className="w-full h-full object-cover" />;
    }
    if (stats.puzzleGradient && Array.isArray(stats.puzzleGradient)) {
      return (
        <div
          className="w-full h-full"
          style={{ background: `linear-gradient(135deg, ${stats.puzzleGradient.join(', ')})` }}
        />
      );
    }
    return (
      <div
        className="w-full h-full"
        style={{ background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)' }}
      />
    );
  };

  // Get puzzle title from puzzleId
  const getPuzzleTitle = (puzzleId: string, stats: any): string => {
    // PRIORITY 1: If the stats object has a puzzleTitle field, use it
    if (stats.puzzleTitle) {
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

    return readable;
  };

  // Calculate overview stats
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

  const currentStreak = completedDates
    ? calculateCurrentStreak(completedDates, frozenDates ?? new Set(), getCurrentDate())
    : 0;

  // Activity trend: every completion (any puzzle, any replay) bucketed
  // by local calendar day, for the last 14 days. This is the one piece
  // of real per-completion history already recorded (completionDates),
  // so it's the only honest source for a trend -- there's no per-attempt
  // time/moves history to chart a "getting faster" line from.
  const activityByDay: Record<string, number> = {};
  Object.values(puzzleStats).forEach((stats: any) => {
    (stats.completionDates || []).forEach((iso: string) => {
      const key = localDayKey(iso);
      activityByDay[key] = (activityByDay[key] || 0) + 1;
    });
  });

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = localDayKey(d.toISOString());
    return { key, count: activityByDay[key] || 0 };
  });

  const maxDayCount = Math.max(1, ...last14Days.map(d => d.count));
  const last7Total = last14Days.slice(7).reduce((sum, d) => sum + d.count, 0);
  const prev7Total = last14Days.slice(0, 7).reduce((sum, d) => sum + d.count, 0);
  const trendDelta = last7Total - prev7Total;
  const hasAnyActivity = last7Total + prev7Total > 0;

  // Draws the shareable card to an offscreen canvas, pulling live theme
  // colors from CSS custom properties so the exported image matches
  // whichever theme the player currently has selected.
  const buildStatsCardCanvas = (): HTMLCanvasElement => {
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

    // Streak hero
    let cursorY = 340;
    if (currentStreak > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = coral;
      ctx.font = '800 240px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(currentStreak), size / 2, cursorY);
      ctx.fillStyle = offwhite;
      ctx.font = '600 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(currentStreak === 1 ? 'DAY STREAK' : 'DAY STREAK', size / 2, cursorY + 150);
      cursorY += 260;
    } else {
      cursorY = 420;
    }

    // 2x2 stat grid
    const stats: [string, string][] = [
      [String(totalGamesPlayed), 'TOTAL GAMES'],
      [String(completedPuzzles), 'PUZZLES SOLVED'],
      [bestTime !== Infinity ? formatTime(bestTime) : '--', 'BEST TIME'],
      [bestMoves !== Infinity ? String(bestMoves) : '--', 'BEST MOVES']
    ];

    const gridTop = cursorY + 40;
    const cellW = (size - 180) / 2;
    const cellH = 200;
    const cellGap = 24;

    stats.forEach(([value, label], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 90 + col * (cellW + cellGap);
      const y = gridTop + row * (cellH + cellGap);

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      const radius = 20;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + cellW, y, x + cellW, y + cellH, radius);
      ctx.arcTo(x + cellW, y + cellH, x, y + cellH, radius);
      ctx.arcTo(x, y + cellH, x, y, radius);
      ctx.arcTo(x, y, x + cellW, y, radius);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = i % 2 === 0 ? teal : coral;
      ctx.font = '700 64px system-ui, -apple-system, sans-serif';
      ctx.fillText(value, x + cellW / 2, y + cellH / 2 - 20);

      ctx.fillStyle = offwhite;
      ctx.globalAlpha = 0.6;
      ctx.font = '600 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(label, x + cellW / 2, y + cellH / 2 + 40);
      ctx.globalAlpha = 1;
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = offwhite;
    ctx.globalAlpha = 0.4;
    ctx.font = '500 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('tileswappy.com', size / 2, height - 60);
    ctx.globalAlpha = 1;

    return canvas;
  };

  const handleShareCard = async () => {
    setShareStatus('sharing');
    try {
      const canvas = buildStatsCardCanvas();
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
      if (!blob) throw new Error('Could not generate image');

      const file = new File([blob], 'tileswappy-stats.png', { type: 'image/png' });
      const shareData = { files: [file], title: 'My TileSwappy Stats' };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tileswappy-stats.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      setShareStatus('done');
    } catch (err) {
      // The user cancelling the native share sheet isn't a real error.
      setShareStatus((err as any)?.name === 'AbortError' ? 'idle' : 'error');
    } finally {
      setTimeout(() => setShareStatus('idle'), 2500);
    }
  };

  const tabs = (
    <div className="flex border-b border-navy px-6 flex-shrink-0">
      <button
        onClick={() => setSelectedTab('overview')}
        className={`px-4 py-3 text-sm font-semibold transition relative ${
          selectedTab === 'overview'
            ? 'text-teal'
            : 'text-offwhite/60 hover:text-offwhite/80'
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
            : 'text-offwhite/60 hover:text-offwhite/80'
        }`}
      >
        Puzzle Details
        {selectedTab === 'details' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal"></div>
        )}
      </button>
    </div>
  );

  return (
    <ModalShell
      onClose={onClose}
      title="Your Stats"
      titleIcon={Trophy}
      subtitle="Track your puzzle-solving journey"
      maxWidth="2xl"
      headerExtra={tabs}
      bodyClassName="p-6"
      footer={
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-offwhite font-bold py-3 px-6 rounded-xl transition shadow-lg"
        >
          Close
        </button>
      }
    >
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

              {/* Activity Trend */}
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="text-teal" size={20} />
                    Activity Trend
                  </h3>
                  {hasAnyActivity && (
                    <span className={`text-xs font-semibold ${trendDelta >= 0 ? 'text-teal' : 'text-coral'}`}>
                      {trendDelta > 0 ? `+${trendDelta}` : trendDelta} vs prior week
                    </span>
                  )}
                </div>
                {hasAnyActivity ? (
                  <>
                    <div className="flex items-end gap-1 h-16">
                      {last14Days.map((d) => (
                        <div key={d.key} className="flex-1 h-full flex items-end" title={`${d.count} puzzle${d.count === 1 ? '' : 's'} on ${d.key}`}>
                          <div
                            className={`w-full rounded-t transition-all ${d.count > 0 ? 'bg-teal' : 'bg-white/10'}`}
                            style={{ height: `${Math.max(6, (d.count / maxDayCount) * 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/40">14 days ago</span>
                      <span className="text-[10px] text-white/40">Today</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-white/40 text-sm">
                    Play a few puzzles to see your activity trend
                  </div>
                )}
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          index === 0 ? 'bg-gold text-navy' :
                          index === 1 ? 'bg-silver text-navy' :
                          index === 2 ? 'bg-bronze text-white' :
                          'bg-navy-light text-white/60'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                          {renderPuzzleThumbnail(stats)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
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

              {/* Share Your Stats */}
              {completedPuzzles > 0 && (
                <div className="bg-black/20 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Share2 className="text-coral" size={20} />
                    Share Your Stats
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-navy to-navy-dark p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <TileSwappyLogo size={28} />
                      <span className="text-white font-bold text-lg">TileSwappy</span>
                    </div>
                    {currentStreak > 0 && (
                      <div className="mb-4">
                        <div className="text-5xl font-black text-coral flex items-center justify-center gap-1">
                          <Flame size={32} className="text-coral" />
                          {currentStreak}
                        </div>
                        <div className="text-xs text-white/60 font-semibold uppercase tracking-wide">
                          Day Streak
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-teal">{totalGamesPlayed}</div>
                        <div className="text-[10px] text-white/60">Total Games</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-coral">{completedPuzzles}</div>
                        <div className="text-[10px] text-white/60">Puzzles Solved</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-lg font-mono font-bold text-white">
                          {bestTime !== Infinity ? formatTime(bestTime) : '--'}
                        </div>
                        <div className="text-[10px] text-white/60">Best Time</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-white">
                          {bestMoves !== Infinity ? bestMoves : '--'}
                        </div>
                        <div className="text-[10px] text-white/60">Best Moves</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-white/30 mt-4">tileswappy.com</div>
                  </div>
                  <button
                    onClick={handleShareCard}
                    disabled={shareStatus === 'sharing'}
                    className="w-full mt-3 bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Share2 size={16} />
                    {shareStatus === 'sharing'
                      ? 'Preparing…'
                      : shareStatus === 'done'
                      ? 'Shared!'
                      : shareStatus === 'error'
                      ? 'Something went wrong — try again'
                      : 'Share Stats Card'}
                  </button>
                </div>
              )}
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
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                            {renderPuzzleThumbnail(stats)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-lg font-bold text-white truncate">
                              {getPuzzleTitle(puzzleId, stats)}
                            </h4>
                            <p className="text-xs text-white/60">
                              Played {stats.attempts} {stats.attempts === 1 ? 'time' : 'times'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
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
    </ModalShell>
  );
};