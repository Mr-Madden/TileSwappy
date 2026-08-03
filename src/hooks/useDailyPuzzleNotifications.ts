import { useCallback, useEffect } from 'react';

// Separate from tileswappy_settings -- this is a pure dedupe stamp, not
// a user preference, so it doesn't need to round-trip through the
// settings load/save machinery.
const LAST_NOTIFIED_KEY = 'tileswappy_last_puzzle_notified_date';

// Previously lived inside the Settings-modal-only DailyPuzzleNotifications
// component, which meant the hourly re-check (and the notification it can
// fire) only ran while that modal happened to be open -- in practice
// never, since nobody leaves Settings open for an hour. Called once from
// App.tsx instead, which stays mounted for the whole session, so a
// midnight rollover during an open session actually gets caught.
export function useDailyPuzzleNotifications(enabled: boolean) {
  const checkForNewPuzzle = useCallback(() => {
    if (!enabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = new Date().toDateString();
    // This is the actual dedupe -- the OLD version read this same kind of
    // date stamp but never wrote it back, so the "already notified today"
    // check could never succeed and every hourly tick (while mounted)
    // re-fired the same notification.
    if (localStorage.getItem(LAST_NOTIFIED_KEY) === today) return;

    new Notification('🎨 New TileSwappy Puzzle!', {
      body: 'A fresh puzzle is waiting for you today!',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'daily-puzzle',
      requireInteraction: false
    });
    localStorage.setItem(LAST_NOTIFIED_KEY, today);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    checkForNewPuzzle();
    // Hourly purely to catch a midnight rollover during a long open
    // session -- the actual once-per-day guarantee is the date stamp
    // above, not this interval.
    const interval = setInterval(checkForNewPuzzle, 3600000);
    return () => clearInterval(interval);
  }, [enabled, checkForNewPuzzle]);
}
