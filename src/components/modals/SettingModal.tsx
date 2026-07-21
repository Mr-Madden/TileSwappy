import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Info, HelpCircle, FileText, Newspaper, Settings, Check, Globe, Bell, Volume2, Eye } from 'lucide-react';
import { DailyPuzzleNotifications } from '../DailyPuzzleNotifications';
import { ModalShell } from '../common/ModalShell';
import { THEMES } from '../../theme/themes';

// Long-press threshold before a theme swatch starts live-previewing --
// short of this, a press-and-release is treated as an ordinary tap
// (select immediately, no preview step).
const THEME_PREVIEW_HOLD_MS = 350;

interface AppSettings {
  selectedLanguage: string;
  notificationsEnabled: boolean;
  vibrateEnabled: boolean;
  soundEnabled?: boolean;
  theme?: string;
}

interface SettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const languages = ['English'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  settings,
  onUpdateSettings
}) => {
  const activeThemeId = settings.theme || 'current';

  // Tap-and-hold live preview: holding a swatch applies its theme to the
  // whole app immediately (via the data-theme attribute App.tsx's own
  // effect otherwise owns) so the player can see it in context before
  // committing. Releasing while still over the swatch commits the
  // preview by calling onUpdateSettings for real; dragging off (or
  // closing the modal) before releasing reverts to the prior theme
  // without ever touching settings.
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedThemeRef = useRef<string | null>(null);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPressTimer();
      if (previewThemeId) {
        document.documentElement.setAttribute('data-theme', activeThemeId);
      }
    };
    // Only needs to run on unmount -- activeThemeId/previewThemeId are
    // read from refs/closure at that moment, not tracked reactively.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemePressStart = (themeId: string) => {
    pressedThemeRef.current = themeId;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      document.documentElement.setAttribute('data-theme', themeId);
      setPreviewThemeId(themeId);
    }, THEME_PREVIEW_HOLD_MS);
  };

  const handleThemePressEnd = (themeId: string) => {
    clearPressTimer();
    if (previewThemeId) {
      onUpdateSettings({ theme: previewThemeId });
      setPreviewThemeId(null);
    } else if (pressedThemeRef.current === themeId) {
      onUpdateSettings({ theme: themeId });
    }
    pressedThemeRef.current = null;
  };

  const handleThemePressCancel = () => {
    clearPressTimer();
    if (previewThemeId) {
      document.documentElement.setAttribute('data-theme', activeThemeId);
      setPreviewThemeId(null);
    }
    pressedThemeRef.current = null;
  };

  const handleSettingClick = (type: string) => {
    switch (type) {
      case 'howToPlay':
        window.open('/how-to-play.html', '_blank');
        break;
      case 'about':
        window.open('/about.html', '_blank');
        break;
      case 'faq':
        window.open('/faq.html', '_blank');
        break;
      case 'blog':
        window.open('/blog/gradient-science.html', '_blank');
        break;
      case 'privacy':
        window.open('/privacy.html', '_blank');
        break;
      case 'terms':
        window.open('/terms.html', '_blank');
        break;
      case 'support':
        window.open('/support.html', '_blank');
        break;
      case 'clearData':
        if (window.confirm('Are you sure you want to clear all local data? This will delete your progress, stats, and settings.')) {
          // Clear all localStorage
          localStorage.clear();
          alert('All local data has been cleared. Refreshing the page...');
          window.location.reload();
        }
        break;
    }
  };

  return (
    <ModalShell onClose={onClose} title="Settings" titleIcon={Settings} maxWidth="md" bodyClassName="">
        {/* Content */}
        <div>
          {/* Theme -- kept first so it catches the eye immediately */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-offwhite/60 text-xs font-semibold uppercase">Theme</h3>
              <span
                className={`flex items-center gap-1 text-[10px] font-semibold text-teal transition-opacity ${
                  previewThemeId ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Eye size={12} /> Previewing — release to apply
              </span>
            </div>
            <div className="bg-navy-dark/40 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => {
                  const isSelected = activeThemeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onPointerDown={() => handleThemePressStart(t.id)}
                      onPointerUp={() => handleThemePressEnd(t.id)}
                      onPointerLeave={handleThemePressCancel}
                      onPointerCancel={handleThemePressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition select-none touch-none ${
                        isSelected ? 'bg-navy-dark ring-2 ring-teal' : 'hover:bg-navy-dark/60'
                      } ${previewThemeId === t.id ? 'ring-2 ring-teal scale-105' : ''}`}
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
          </div>

          {/* Learn & Info Section */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Learn & Info</h3>

            <button
              onClick={() => handleSettingClick('howToPlay')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <BookOpen size={20} className="text-teal" />
              <span className="text-offwhite font-semibold flex-1 text-left">How to Play</span>
              <span className="text-offwhite/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('about')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <Info size={20} className="text-teal" />
              <span className="text-offwhite font-semibold flex-1 text-left">About TileSwappy</span>
              <span className="text-offwhite/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('faq')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <HelpCircle size={20} className="text-teal" />
              <span className="text-offwhite font-semibold flex-1 text-left">FAQ</span>
              <span className="text-offwhite/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('blog')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <Newspaper size={20} className="text-teal" />
              <span className="text-offwhite font-semibold flex-1 text-left">Blog & Strategies</span>
              <span className="text-offwhite/60">→</span>
            </button>
          </div>

          {/* Legal Section */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Legal</h3>

            <button
              onClick={() => handleSettingClick('privacy')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <FileText size={20} className="text-offwhite/60" />
              <span className="text-offwhite font-semibold flex-1 text-left">Privacy Policy</span>
              <span className="text-offwhite/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('terms')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <FileText size={20} className="text-offwhite/60" />
              <span className="text-offwhite font-semibold flex-1 text-left">Terms of Service</span>
              <span className="text-offwhite/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('support')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 transition"
            >
              <FileText size={20} className="text-offwhite/60" />
              <span className="text-offwhite font-semibold flex-1 text-left">Support</span>
              <span className="text-offwhite/60">→</span>
            </button>
          </div>

          {/* Preferences Section */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Preferences</h3>

            {/* Language */}
            <div className="flex items-center gap-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 p-4 transition">
              <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                <Globe size={20} className="text-teal" />
              </div>
              <span className="text-offwhite font-semibold flex-1">Language</span>
              <select
                value={settings.selectedLanguage}
                onChange={(e) => onUpdateSettings({ selectedLanguage: e.target.value })}
                className="bg-offwhite/20 text-offwhite px-3 py-1 rounded-lg border-none outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="bg-navy-dark">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Puzzle Notifications */}
            <div className="bg-offwhite/10 hover:bg-offwhite/15 rounded-lg mb-2 p-4 transition">
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

            {/* Sound */}
            {settings.soundEnabled !== undefined && (
              <div className="flex items-center gap-3 bg-offwhite/10 hover:bg-offwhite/15 rounded-lg p-4 transition">
                <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center flex-shrink-0">
                  <Volume2 size={20} className="text-violet" />
                </div>
                <span className="text-offwhite font-semibold flex-1">Audio (Coming Soon)</span>
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
            )}
          </div>

          {/* Data Management */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <h3 className="text-offwhite/60 text-xs font-semibold uppercase mb-3">Data</h3>
            
            <div className="bg-offwhite/10 rounded-lg p-4 mb-2">
              <p className="text-offwhite/80 text-sm mb-2">
                Your progress is automatically saved to your device. No account required!
              </p>
              <p className="text-offwhite/60 text-xs">
                All data is stored locally on this device only.
              </p>
            </div>

            <button
              onClick={() => handleSettingClick('clearData')}
              className="w-full bg-coral/20 hover:bg-coral/30 text-coral font-semibold py-3 px-6 rounded-xl transition"
            >
              Clear All Data
            </button>
          </div>

          {/* App Info */}
          <div className="px-6 py-4 border-t border-offwhite/10">
            <div className="text-center text-sm text-offwhite/40">
              <p>TileSwappy v1.0.0</p>
              <p className="text-xs mt-1">© 2025 Mad_Den Gaming Co.</p>
              <p className="text-xs mt-1">All rights reserved</p>
            </div>
          </div>
        </div>
    </ModalShell>
  );
};