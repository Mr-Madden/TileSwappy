import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';

export const DailyPuzzleNotifications: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const checkForNewPuzzle = useCallback(() => {
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
  }, [notificationsEnabled]);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      // Check if user has enabled notifications
      const enabled = localStorage.getItem('dailyPuzzleNotifications') === 'true';
      setNotificationsEnabled(enabled);

      // Check for new puzzle on load
      checkForNewPuzzle();
    }
  }, [checkForNewPuzzle]);

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

// Alternative: Simple in-app banner component
export const NewPuzzleBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastVisit = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();

    if (lastVisit !== today) {
      setShow(true);
      localStorage.setItem('lastVisitDate', today);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-teal to-coral px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
        <span className="text-2xl">🎨</span>
        <span className="text-navy font-bold">New puzzle available today!</span>
        <button
          onClick={() => {
            setShow(false);
            onDismiss();
          }}
          className="text-navy hover:text-navy-dark transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Service Worker registration (add to index.tsx or App.tsx)
export const registerDailyPuzzleServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('Service Worker registered:', registration);
    });
  }
};