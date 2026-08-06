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

export type AccessoryKind = 'desert' | 'ice' | 'candy' | 'halloween' | 'winter' | 'valentine';

const THEME_ACCESSORY: Partial<Record<string, AccessoryKind>> = {
  desert: 'desert',
  ice: 'ice',
  candy: 'candy'
};

// Month is 0-indexed (Date#getMonth()). Ranges are deliberately generous
// "seasons" rather than the single calendar day -- most players who ever
// see this only open the app a few times a month, so a one-day window
// would mean almost nobody ever does.
function getSeasonalAccessory(now: Date): AccessoryKind | null {
  const month = now.getMonth();
  const day = now.getDate();

  if (month === 9 && day >= 15) return 'halloween'; // Oct 15-31
  if (month === 11) return 'winter'; // all of December
  if (month === 1 && day >= 7 && day <= 14) return 'valentine'; // Feb 7-14
  return null;
}

// Seasonal takes priority over a theme's own accessory when both would
// apply -- it's the rarer, more special one, and only ever active a few
// weeks a year. TileMascot renders at most one accessory at a time, so
// this is a fallback chain rather than a combination.
export function getAccessoryForTheme(themeId: string, now: Date = new Date()): AccessoryKind | null {
  return getSeasonalAccessory(now) ?? THEME_ACCESSORY[themeId] ?? null;
}
