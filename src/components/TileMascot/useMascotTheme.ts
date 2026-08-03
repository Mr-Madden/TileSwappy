const SETTINGS_STORAGE_KEY = 'tileswappy_settings';

// Same pattern as useMascotSound -- Tilo shows up in places that don't
// have the active theme threaded down to them, so this reads the same
// localStorage key App.tsx persists settings.theme under, fresh on
// every render (cheap, synchronous, and stays correct even if the
// theme changes while a Tilo instance is already mounted, e.g. inside
// the Settings modal itself).
export function useMascotTheme(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return settings.theme || 'current';
  } catch {
    return 'current';
  }
}

export type AccessoryKind = 'desert' | 'ice' | 'candy';

const THEME_ACCESSORY: Partial<Record<string, AccessoryKind>> = {
  desert: 'desert',
  ice: 'ice',
  candy: 'candy'
};

export function getAccessoryForTheme(themeId: string): AccessoryKind | null {
  return THEME_ACCESSORY[themeId] ?? null;
}
