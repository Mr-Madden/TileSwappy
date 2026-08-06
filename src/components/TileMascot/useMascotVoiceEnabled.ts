const SETTINGS_STORAGE_KEY = 'tileswappy_settings';

// Same pattern as useMascotTheme/useMascotSound -- Tilo's speech bubbles
// show up in places that don't have Settings threaded down to them, so
// this reads the same localStorage key App.tsx persists settings under,
// fresh on every call. A separate toggle from soundEnabled: a player
// might want game sound effects on but Tilo's chatter off, or vice versa.
export function useMascotVoiceEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return settings.mascotVoiceEnabled !== false;
  } catch {
    return true;
  }
}
