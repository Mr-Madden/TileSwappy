import React from 'react';
import { X, BookOpen, Info, HelpCircle, FileText, Newspaper } from 'lucide-react';
import { DailyPuzzleNotifications } from '../DailyPuzzleNotifications';

interface AppSettings {
  selectedLanguage: string;
  notificationsEnabled: boolean;
  vibrateEnabled: boolean;
  soundEnabled?: boolean;
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-light rounded-2xl max-w-md w-full shadow-2xl border-2 border-navy-dark max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-navy-dark px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-navy sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-offwhite">⚙️ Settings</h2>
          <button onClick={onClose} className="text-offwhite/60 hover:text-offwhite transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Learn & Info Section */}
          <div className="px-6 py-4">
            <h3 className="text-white/60 text-xs font-semibold uppercase mb-3">Learn & Info</h3>

            <button
              onClick={() => handleSettingClick('howToPlay')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <BookOpen size={20} className="text-teal" />
              <span className="text-white font-semibold flex-1 text-left">How to Play</span>
              <span className="text-white/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('about')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <Info size={20} className="text-teal" />
              <span className="text-white font-semibold flex-1 text-left">About TileSwappy</span>
              <span className="text-white/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('faq')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <HelpCircle size={20} className="text-teal" />
              <span className="text-white font-semibold flex-1 text-left">FAQ</span>
              <span className="text-white/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('blog')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <Newspaper size={20} className="text-teal" />
              <span className="text-white font-semibold flex-1 text-left">Blog & Strategies</span>
              <span className="text-white/60">→</span>
            </button>
          </div>

          {/* Legal Section */}
          <div className="px-6 py-4 border-t border-white/10">
            <h3 className="text-white/60 text-xs font-semibold uppercase mb-3">Legal</h3>

            <button
              onClick={() => handleSettingClick('privacy')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <FileText size={20} className="text-white/60" />
              <span className="text-white font-semibold flex-1 text-left">Privacy Policy</span>
              <span className="text-white/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('terms')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <FileText size={20} className="text-white/60" />
              <span className="text-white font-semibold flex-1 text-left">Terms of Service</span>
              <span className="text-white/60">→</span>
            </button>

            <button
              onClick={() => handleSettingClick('support')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg mb-2 transition"
            >
              <FileText size={20} className="text-white/60" />
              <span className="text-white font-semibold flex-1 text-left">Support</span>
              <span className="text-white/60">→</span>
            </button>
          </div>

          {/* Preferences Section */}
          <div className="px-6 py-4 border-t border-white/10">
            <h3 className="text-white/60 text-xs font-semibold uppercase mb-3">Preferences</h3>

            {/* Language */}
            <div className="bg-white/10 rounded-lg mb-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Language</span>
                <select
                  value={settings.selectedLanguage}
                  onChange={(e) => onUpdateSettings({ selectedLanguage: e.target.value })}
                  className="bg-white/20 text-white px-3 py-1 rounded-lg border-none outline-none"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang} className="bg-gray-800">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Daily Puzzle Notifications */}
            <div className="bg-white/10 rounded-lg mb-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">Daily Puzzle Alerts</div>
                  <p className="text-xs text-white/60">Get notified when new puzzles are available</p>
                </div>
                <div className="flex-shrink-0">
                  <DailyPuzzleNotifications />
                </div>
              </div>
            </div>

            {/* Sound */}
            {settings.soundEnabled !== undefined && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Audio (Coming Soon)</span>
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`relative w-12 h-6 rounded-full transition ${
                      settings.soundEnabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : ''
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Data Management */}
          <div className="px-6 py-4 border-t border-white/10">
            <h3 className="text-white/60 text-xs font-semibold uppercase mb-3">Data</h3>
            
            <div className="bg-white/10 rounded-lg p-4 mb-2">
              <p className="text-white/80 text-sm mb-2">
                Your progress is automatically saved to your device. No account required!
              </p>
              <p className="text-white/60 text-xs">
                All data is stored locally on this device only.
              </p>
            </div>

            <button
              onClick={() => handleSettingClick('clearData')}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 px-6 rounded-xl transition"
            >
              Clear All Data
            </button>
          </div>

          {/* App Info */}
          <div className="px-6 py-4 border-t border-white/10">
            <div className="text-center text-sm text-white/40">
              <p>TileSwappy v1.0.0</p>
              <p className="text-xs mt-1">© 2025 Mad_Den Gaming Co.</p>
              <p className="text-xs mt-1">All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};