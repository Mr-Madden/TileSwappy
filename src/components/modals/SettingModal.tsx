import React, { useEffect, useRef, useState } from 'react';
import { Settings, Check, Bell, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { DailyPuzzleNotifications } from '../DailyPuzzleNotifications';
import { ModalShell } from '../common/ModalShell';
import { THEMES } from '../../theme/themes';
import { useSoundEffects, SoundStyle } from '../../hooks/useSoundEffects';

const SOUND_STYLES: { id: SoundStyle; name: string; description: string }[] = [
  { id: 'bowl', name: 'Bowl', description: 'Warm, rounded, singing bowl-like' },
  { id: 'wood', name: 'Wood', description: 'Soft mallet strikes' },
  { id: 'glass', name: 'Glass', description: 'Bright, chime-like shimmer' },
  { id: 'arcade', name: 'Arcade', description: 'Classic upbeat game blips' }
];

interface AppSettings {
  notificationsEnabled: boolean;
  vibrateEnabled: boolean;
  soundEnabled?: boolean;
  soundStyle?: SoundStyle;
  soundVolume?: number;
  theme?: string;
}

interface SettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  settings,
  onUpdateSettings
}) => {
  const activeThemeId = settings.theme || 'current';
  const activeSoundStyle = settings.soundStyle ?? 'wood';
  const activeVolume = settings.soundVolume ?? 0.8;

  // Preview hook mirrors whatever style/volume is currently selected (not
  // yet necessarily committed via onUpdateSettings' async setState), so a
  // tap on a style swatch or a drag on the slider is instantly audible.
  const [previewStyle, setPreviewStyle] = useState<SoundStyle>(activeSoundStyle);
  const [previewVolume, setPreviewVolume] = useState<number>(activeVolume);
  const previewSound = useSoundEffects(true, previewStyle, previewVolume);
  const previewSoundRef = useRef(previewSound);
  const isFirstRender = useRef(true);
  const volumePreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    previewSoundRef.current = previewSound;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    previewSound('tap');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewStyle]);

  const handleStyleSelect = (styleId: SoundStyle) => {
    onUpdateSettings({ soundStyle: styleId });
    setPreviewStyle(styleId);
  };

  const handleVolumeChange = (value: number) => {
    onUpdateSettings({ soundVolume: value });
    setPreviewVolume(value);
    if (volumePreviewTimer.current) clearTimeout(volumePreviewTimer.current);
    volumePreviewTimer.current = setTimeout(() => {
      previewSoundRef.current('tap');
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (volumePreviewTimer.current) clearTimeout(volumePreviewTimer.current);
    };
  }, []);

  const handleThemeSelect = (themeId: string) => {
    onUpdateSettings({ theme: themeId });
  };

  const handleLegalClick = (page: 'privacy' | 'terms' | 'support') => {
    window.open(`/${page}.html`, '_blank');
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This will delete your progress, stats, and settings.')) {
      localStorage.clear();
      alert('All local data has been cleared. Refreshing the page...');
      window.location.reload();
    }
  };

  return (
    <ModalShell onClose={onClose} title="Settings" titleIcon={Settings} maxWidth="md" bodyClassName="">
        {/* Content */}
        <div>
          {/* Theme -- kept first so it catches the eye immediately. Tap
              a swatch to select it; the app re-themes right away. */}
          <div className="px-6 py-4">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Theme</h3>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => {
                const isSelected = activeThemeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeSelect(t.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition ${
                      isSelected ? 'bg-navy-dark ring-2 ring-teal' : 'bg-navy-dark/40 hover:bg-navy-dark/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex border border-offwhite/20 shadow-md">
                      <div className="w-1/3 h-full" style={{ backgroundColor: t.swatch[0] }} />
                      <div className="w-1/3 h-full" style={{ backgroundColor: t.swatch[1] }} />
                      <div className="w-1/3 h-full" style={{ backgroundColor: t.swatch[2] }} />
                    </div>
                    <span className="text-[10px] text-offwhite/80 font-medium text-center leading-tight">
                      {t.name}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-teal rounded-full p-0.5">
                        <Check size={10} strokeWidth={3} className="text-navy" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound & Haptics -- both are in-game feedback, grouped in one card */}
          {settings.soundEnabled !== undefined && (
            <div className="px-6 py-4 border-t border-offwhite/10">
              <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Sound & Haptics</h3>
              <div className="bg-offwhite/10 rounded-lg divide-y divide-offwhite/10">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center flex-shrink-0">
                      <Volume2 size={20} className="text-violet" />
                    </div>
                    <span className="text-offwhite font-semibold flex-1">Sound Effects</span>
                    <button
                      onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                      className={`relative w-12 h-6 rounded-full transition ${
                        settings.soundEnabled ? 'bg-teal' : 'bg-offwhite/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-offwhite rounded-full transition-transform ${
                          settings.soundEnabled ? 'translate-x-6' : ''
                        }`}
                      ></div>
                    </button>
                  </div>

                  {settings.soundEnabled && (
                    <div className="mt-4 pl-[52px] space-y-4">
                      <div>
                        <span className="block text-xs text-offwhite/60 font-semibold uppercase mb-2">Style</span>
                        <div className="grid grid-cols-2 gap-2">
                          {SOUND_STYLES.map((s) => {
                            const isSelected = activeSoundStyle === s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={() => handleStyleSelect(s.id)}
                                className={`relative text-left px-3 py-2 rounded-lg transition ${
                                  isSelected ? 'bg-navy-dark ring-2 ring-teal' : 'bg-navy-dark/40 hover:bg-navy-dark/60'
                                }`}
                              >
                                <span className="block text-sm font-semibold text-offwhite">{s.name}</span>
                                {isSelected && (
                                  <span className="absolute top-1.5 right-1.5 bg-teal rounded-full p-0.5">
                                    <Check size={9} strokeWidth={3} className="text-navy" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-offwhite/60 font-semibold uppercase">Volume</span>
                          <span className="text-xs text-offwhite/60 font-mono">{Math.round(activeVolume * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {activeVolume === 0 ? (
                            <VolumeX size={16} className="text-offwhite/50 flex-shrink-0" />
                          ) : (
                            <Volume2 size={16} className="text-offwhite/50 flex-shrink-0" />
                          )}
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={activeVolume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="flex-1 accent-teal h-2 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                    <Vibrate size={20} className="text-teal" />
                  </div>
                  <span className="text-offwhite font-semibold flex-1">Haptics</span>
                  <button
                    onClick={() => onUpdateSettings({ vibrateEnabled: !settings.vibrateEnabled })}
                    className={`relative w-12 h-6 rounded-full transition ${
                      settings.vibrateEnabled ? 'bg-teal' : 'bg-offwhite/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-offwhite rounded-full transition-transform ${
                        settings.vibrateEnabled ? 'translate-x-6' : ''
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Notifications</h3>
            <div className="bg-offwhite/10 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
                  <Bell size={20} className="text-coral" />
                </div>
                <span className="text-offwhite font-semibold flex-1">Daily Puzzle Alerts</span>
              </div>
              <p className="text-xs text-offwhite/60 mb-3 pl-[52px]">Get notified when new puzzles are available</p>
              <div className="pl-[52px]">
                <DailyPuzzleNotifications />
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Data</h3>
            <p className="text-offwhite/60 text-xs mb-3">
              Progress is saved locally on this device only — no account required.
            </p>
            <button
              onClick={handleClearData}
              className="w-full bg-coral/20 hover:bg-coral/30 text-coral font-semibold py-3 px-6 rounded-xl transition"
            >
              Clear All Data
            </button>
          </div>

          {/* Footer -- legal + app info, kept last and minimal */}
          <div className="px-6 py-4 border-t border-offwhite/10 text-center">
            <div className="flex items-center justify-center gap-3 text-xs font-medium text-teal mb-3">
              <button onClick={() => handleLegalClick('privacy')} className="hover:text-teal-dark transition">Privacy</button>
              <span className="text-offwhite/20">·</span>
              <button onClick={() => handleLegalClick('terms')} className="hover:text-teal-dark transition">Terms</button>
              <span className="text-offwhite/20">·</span>
              <button onClick={() => handleLegalClick('support')} className="hover:text-teal-dark transition">Support</button>
            </div>
            <p className="text-xs text-offwhite/40">TileSwappy v1.0.0 · © 2025 Mad_Den Gaming Co.</p>
          </div>
        </div>
    </ModalShell>
  );
};