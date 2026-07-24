import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';

export const DailyPuzzleNotifications: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const checkForNewPuzzle = useCallback(() => {
    const lastPuzzleDate = localStorage.getItem('lastPuzzleDate');
    const today = new Date().toDateString();

    if (lastPuzzleDate !== today && notificationsEnabled && Notification.permission === 'granted') {
      new Notification('🎨 New TileSwappy Puzzle!', {
        body: 'A fresh puzzle is waiting for you today!',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'daily-puzzle',
        requireInteraction: false
      });
    }
    // Update last puzzle date (set this when user completes or starts today's puzzle)
    // localStorage.setItem('lastPuzzleDate', today);
  }, [notificationsEnabled]);

  useEffect(() => {
    if (!('Notification' in window)) return;
    const enabled = localStorage.getItem('dailyPuzzleNotifications') === 'true';
    setNotificationsEnabled(enabled);
  }, []);

  // Re-checks on mount (once notificationsEnabled has loaded from storage)
  // and hourly thereafter while the app stays open, in case midnight
  // passes during the session -- cleared whenever notifications are
  // disabled or the component unmounts, so it never runs forever in
  // the background.
  useEffect(() => {
    checkForNewPuzzle();
    if (!notificationsEnabled) return;
    const interval = setInterval(checkForNewPuzzle, 3600000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, checkForNewPuzzle]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('dailyPuzzleNotifications', 'true');

      // Show test notification
      new Notification('🎉 Notifications Enabled!', {
        body: "You'll be notified when new puzzles are available",
        icon: '/logo192.png'
      });
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    localStorage.setItem('dailyPuzzleNotifications', 'false');
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      disableNotifications();
    } else {
      requestNotificationPermission();
    }
  };

  // Don't show if notifications aren't supported
  if (!('Notification' in window)) {
    return null;
  }

  return (
    <button
      onClick={toggleNotifications}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
        notificationsEnabled
          ? 'bg-teal text-navy hover:bg-teal/90'
          : 'bg-navy-dark text-offwhite hover:bg-navy border border-navy'
      }`}
    >
      {notificationsEnabled ? (
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