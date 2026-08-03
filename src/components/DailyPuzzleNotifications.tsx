import React from 'react';
import { Bell, BellOff } from 'lucide-react';

interface DailyPuzzleNotificationsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

// Purely a controlled toggle now -- the actual hourly check-and-notify
// logic lives in useDailyPuzzleNotifications, called from App.tsx so it
// keeps running for the whole session instead of only while this sits
// inside an open Settings modal. The stored preference (`enabled`) is
// necessary but not sufficient -- actual firing also depends on real
// browser permission, so the UI here reflects that directly instead of
// just echoing back the stored flag.
export const DailyPuzzleNotifications: React.FC<DailyPuzzleNotificationsProps> = ({
  enabled,
  onEnabledChange
}) => {
  if (!('Notification' in window)) {
    return null;
  }

  const permission = Notification.permission;
  const isBlocked = permission === 'denied';
  const isOn = enabled && permission === 'granted';

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      onEnabledChange(true);
      // Confirms the permission grant actually produces a visible
      // notification right away, rather than the player having to take
      // it on faith until tomorrow's puzzle.
      new Notification('🎉 Notifications Enabled!', {
        body: "You'll be notified when new puzzles are available",
        icon: '/icon.png'
      });
    } else {
      onEnabledChange(false);
    }
  };

  const toggleNotifications = () => {
    if (isBlocked) return;
    if (enabled) {
      onEnabledChange(false);
    } else {
      requestNotificationPermission();
    }
  };

  return (
    <button
      onClick={toggleNotifications}
      disabled={isBlocked}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
        isBlocked
          ? 'bg-navy-dark text-offwhite/40 border border-navy cursor-not-allowed'
          : isOn
          ? 'bg-teal text-navy hover:bg-teal/90'
          : 'bg-navy-dark text-offwhite hover:bg-navy border border-navy'
      }`}
    >
      {isBlocked ? (
        <>
          <BellOff size={18} />
          <span className="text-sm font-medium">Blocked in browser settings</span>
        </>
      ) : isOn ? (
        <>
          <Bell size={18} />
          <span className="text-sm font-medium">Notifications On</span>
        </>
      ) : (
        <>
          <BellOff size={18} />
          <span className="text-sm font-medium">Get Daily Alerts</span>
        </>
      )}
    </button>
  );
};
