import { useSoundEffects, SoundStyle } from '../../hooks/useSoundEffects';

const SETTINGS_STORAGE_KEY = 'tileswappy_settings';

// Tilo shows up in places that don't have App's sound settings threaded
// down to them (modals, the tutorial, the idle-hints popup) -- rather
// than prop-drill enabled/style/volume through every one of them, read
// the same localStorage key App.tsx already persists settings under.
// Read fresh on every render (cheap, synchronous) so a toggle in
// Settings takes effect on Tilo's very next poke without any wiring.
function readSoundSettings(): { enabled: boolean; style: SoundStyle; volume: number } {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return {
      enabled: settings.soundEnabled ?? true,
      style: settings.soundStyle ?? 'wood',
      volume: settings.soundVolume ?? 0.8
    };
  } catch {
    return { enabled: true, style: 'wood', volume: 0.8 };
  }
}

export function useMascotSound() {
  const { enabled, style, volume } = readSoundSettings();
  return useSoundEffects(enabled, style, volume);
}
