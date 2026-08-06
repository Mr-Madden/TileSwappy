const SETTINGS_STORAGE_KEY = 'tileswappy_settings';

// Same self-contained-read pattern as useMascotSound/useMascotTheme -- for
// components that don't have App.tsx's `settings` state threaded down to
// them (CoachMarkTour is shared by the menu walkthrough and the gameboard
// walkthrough, mounted well outside App's own handler closures). Reads
// fresh from the same localStorage key App.tsx persists settings under,
// so a toggle in Settings takes effect on the very next call.
export function useHaptics() {
  return (pattern: number | number[]) => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = raw ? JSON.parse(raw) : {};
      if (settings.vibrateEnabled === false) return;
    } catch {
      // ignore -- fall through and vibrate, same fail-open default App.tsx's own triggerHaptic uses
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
}
