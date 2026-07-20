// Streak math for the Streak modal: current/longest streak length,
// milestone detection, and streak-freeze gap detection. Kept separate
// from StreakModal.tsx since App.tsx also needs this (for the freeze
// auto-grant + longest-streak tracking that lives in its own effects).

export const STREAK_MILESTONES = [7, 30, 100];

// Local-time YYYY-MM-DD shift, matching utils/helpers.ts's getCurrentDate --
// deliberately not using Date#toISOString(), which is UTC-based and can
// land on the wrong calendar day depending on the user's timezone.
export function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isCovered(dateStr: string, completedDates: Set<string>, frozenDates: Set<string>): boolean {
  return completedDates.has(dateStr) || frozenDates.has(dateStr);
}

/**
 * Consecutive-day streak ending today (or yesterday, if today's puzzle
 * hasn't been played yet -- a streak shouldn't look broken just because
 * it's early in the day). Frozen dates count the same as completed ones.
 */
export function calculateCurrentStreak(
  completedDates: Set<string>,
  frozenDates: Set<string>,
  todayStr: string
): number {
  let cursor = isCovered(todayStr, completedDates, frozenDates) ? todayStr : shiftDateStr(todayStr, -1);
  let streak = 0;
  while (isCovered(cursor, completedDates, frozenDates)) {
    streak++;
    cursor = shiftDateStr(cursor, -1);
  }
  return streak;
}

/**
 * Longest consecutive run anywhere in the user's history, not just the
 * trailing streak ending today. Derived straight from completedDates
 * (never pruned) plus frozenDates rather than a separately persisted
 * counter, so there's no separate value that can drift out of sync.
 */
export function calculateLongestStreak(completedDates: Set<string>, frozenDates: Set<string>): number {
  const allDates = Array.from(new Set([...Array.from(completedDates), ...Array.from(frozenDates)])).sort();
  let longest = 0;
  let running = 0;
  let prev: string | null = null;
  for (const dateStr of allDates) {
    if (prev && shiftDateStr(prev, 1) === dateStr) {
      running++;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
    prev = dateStr;
  }
  return longest;
}

/**
 * If yesterday was missed but the day before was covered (an active
 * streak just broke), returns the missed date so the UI can offer a
 * freeze for it. Returns null once there's nothing to rescue -- either
 * the streak is intact or the gap is already more than one day old.
 */
export function findFreezableGap(
  completedDates: Set<string>,
  frozenDates: Set<string>,
  todayStr: string
): string | null {
  const yesterday = shiftDateStr(todayStr, -1);
  const dayBefore = shiftDateStr(todayStr, -2);
  if (!isCovered(yesterday, completedDates, frozenDates) && isCovered(dayBefore, completedDates, frozenDates)) {
    return yesterday;
  }
  return null;
}
