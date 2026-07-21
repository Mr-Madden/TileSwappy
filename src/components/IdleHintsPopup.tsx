import React, { useState, useEffect } from 'react';

interface IdleHintsPopupProps {
  onOpenArchive: () => void;
  onOpenStreak: () => void;
  onOpenStats: () => void;
}

export const IdleHintsPopup: React.FC<IdleHintsPopupProps> = ({
  onOpenArchive,
  onOpenStreak,
  onOpenStats
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [hasBeenUsed, setHasBeenUsed] = useState(false);

  useEffect(() => {
    // Only reset the idle timer on interactions, don't close the popup.
    // click/touchstart are the actual primary interaction on a touch-
    // first puzzle game -- without them, tapping tiles/buttons never
    // registered as activity, so the "last interaction" timestamp went
    // stale the moment the popup was dismissed and the very next 1s
    // idle-check immediately reopened it.
    const handleInteraction = () => {
      setLastInteraction(Date.now());
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const checkIdle = setInterval(() => {
      // Don't show popup again if it's already been used
      if (hasBeenUsed) return;
      
      const idleTime = Date.now() - lastInteraction;
      if (idleTime >= 5000 && !showPopup) {
        setShowPopup(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [lastInteraction, showPopup, hasBeenUsed]);

  if (!showPopup) return null;

  // Any dismissal -- X, backdrop click, or picking a suggestion -- counts
  // as "seen" for the rest of this session, not just picking a suggestion.
  const dismiss = () => {
    setShowPopup(false);
    setHasBeenUsed(true);
  };

  const handleArchiveClick = () => {
    dismiss();
    setTimeout(() => onOpenArchive(), 100);
  };

  const handleStreakClick = () => {
    dismiss();
    setTimeout(() => onOpenStreak(), 100);
  };

  const handleStatsClick = () => {
    dismiss();
    setTimeout(() => onOpenStats(), 100);
  };

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-end justify-center p-4" 
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => {
        // Close if clicking the backdrop directly
        if (e.target === e.currentTarget) {
          dismiss();
        }
      }}
    >
      <div 
        className="bg-navy-light rounded-2xl border-2 border-teal/30 p-6 max-w-md w-full mb-20 shadow-2xl"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-teal">💡 Quick Tips</h3>
          <span
            className="text-offwhite/60 hover:text-offwhite cursor-pointer text-2xl"
            onClick={dismiss}
          >
            ×
          </span>
        </div>

        <p className="text-offwhite/80 text-sm mb-5">
          Looking for something to play? Try these:
        </p>

        <div className="space-y-3">
          {/* Archive */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleArchiveClick();
            }}
            className="w-full rounded-xl p-4 cursor-pointer bg-violet/20 hover:bg-violet/30 border-2 border-violet/40 hover:border-violet/60 transition-all"
          >
            <h4 className="text-lg font-bold text-violet-light mb-1">🗂️ Practice Puzzles</h4>
            <p className="text-offwhite/70 text-xs">Easy gradient puzzles to practice your skills</p>
          </div>

          {/* Streak */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStreakClick();
            }}
            className="w-full rounded-xl p-4 cursor-pointer bg-teal/20 hover:bg-teal/30 border-2 border-teal/40 hover:border-teal/60 transition-all"
          >
            <h4 className="text-lg font-bold text-teal mb-1">📅 Daily Calendar</h4>
            <p className="text-offwhite/70 text-xs">Play daily puzzles and build your streak</p>
          </div>

          {/* Stats */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsClick();
            }}
            className="w-full rounded-xl p-4 cursor-pointer bg-coral/20 hover:bg-coral/30 border-2 border-coral/40 hover:border-coral/60 transition-all"
          >
            <h4 className="text-lg font-bold text-coral mb-1">📊 Your Stats</h4>
            <p className="text-offwhite/70 text-xs">View your progress and best times</p>
          </div>
        </div>

        <p className="text-center text-offwhite/50 text-xs mt-4">
          Tap anywhere outside to dismiss
        </p>
      </div>
    </div>
  );
};