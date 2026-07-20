import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

export const DailyPuzzleNotifications: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Check if user has enabled notifications
      const enabled = localStorage.getItem('dailyPuzzleNotifications') === 'true';
      setNotificationsEnabled(enabled);

      // Check for new puzzle on load
      checkForNewPuzzle();
    }
  }, []);

  const checkForNewPuzzle = () => {
    const lastPuzzleDate = localStorage.getItem('lastPuzzleDate');
    const today = new Date().toDateString();

    if (lastPuzzleDate !== today) {
      // New puzzle available!
      if (notificationsEnabled && Notification.permission === 'granted') {
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
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('dailyPuzzleNotifications', 'true');
      
      // Show test notification
      new Notification('🎉 Notifications Enabled!', {
        body: "You'll be notified when new puzzles are available",
        icon: '/logo192.png'
      });

      // Set up daily check (this runs when app is open)
      setupDailyCheck();
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    localStorage.setItem('dailyPuzzleNotifications', 'false');
  };

  const setupDailyCheck = () => {
    // Check every hour if user has the app open
    setInterval(() => {
      checkForNewPuzzle();
    }, 3600000); // 1 hour
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