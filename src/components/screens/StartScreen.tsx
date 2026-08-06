// src/components/StartScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { TileSwappyLogo } from '../TileSwappyLogo/TileSwappyLogo';
import { TileSwappyWordmark } from '../TileSwappyLogo/TileSwappyWordmark';
import type { MascotLine } from '../TileMascot/types';
import { RoamingMascot } from '../TileMascot/RoamingMascot';

interface StartScreenProps {
  onStart: () => void;
  onOpenSettings: () => void;
}

const LAST_VISIT_KEY = 'tileswappy_last_visit';

// One picked at random on load, and tapping Tilo cycles to another --
// his whole job here is to make the start screen feel a little alive.
const GREETINGS: MascotLine[] = [
  { text: "Ready to swap some tiles?" },
  { text: "Today's puzzle is waiting for you!" },
  { text: "Let's beat yesterday's time.", expression: 'excited' },
  { text: "I've got a good feeling about this one.", expression: 'wink' },
  { text: "Tap in whenever you're ready!" },
  { text: "Poke me again, I don't mind." },
  { text: "Okay okay, I'll stop stalling. Go play!", expression: 'laughing' },
  { text: "Did you know every puzzle has exactly one solution?", expression: 'thinking' },
  { text: "I love puzzle day. Every day is puzzle day!", expression: 'love' },
  { text: "Wait, was I supposed to say something clever here?", expression: 'confused' },
  { text: "Sneak peek: today's one is a good one.", expression: 'wink' }
];

// A special returning-player or time-of-day line takes over the whole
// pool for just this one mount (rather than being diluted 1-in-12
// inside GREETINGS) so it's actually likely to be seen when it applies
// -- most visits hit neither condition and just get the regular pool.
function buildGreetings(): MascotLine[] {
  const now = new Date();
  const lastVisitRaw = (() => {
    try {
      return localStorage.getItem(LAST_VISIT_KEY);
    } catch {
      return null;
    }
  })();

  try {
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  } catch {
    // ignore -- worst case the welcome-back line just never fires
  }

  if (lastVisitRaw) {
    const daysSince = Math.floor((now.getTime() - new Date(lastVisitRaw).getTime()) / 86400000);
    if (daysSince >= 7) {
      return [
        { text: "Whoa, it's been over a week! I missed you.", expression: 'love' },
        { text: 'Welcome back, stranger!', expression: 'excited' }
      ];
    }
    if (daysSince >= 2) {
      return [
        { text: `Welcome back! It's been ${daysSince} days.`, expression: 'happy' },
        { text: 'Good to see you again!', expression: 'wink' }
      ];
    }
  }

  const hour = now.getHours();
  if (hour < 5) {
    return [
      { text: 'Up late, huh? I respect it.', expression: 'sleepy' },
      { text: 'Shh, everyone else is asleep.', expression: 'wink' }
    ];
  }
  if (hour < 11) {
    return [{ text: "Good morning! Ready for today's puzzle?", expression: 'happy' }, ...GREETINGS];
  }
  if (hour >= 22) {
    return [{ text: 'Burning the midnight oil?', expression: 'sleepy' }, ...GREETINGS];
  }

  return GREETINGS;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings }) => {
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  // Computed once per mount (not per render) -- it both reads AND writes
  // the last-visit timestamp, so recomputing on every render would stamp
  // "now" as the last visit repeatedly and the welcome-back check would
  // never see a real gap.
  const [greetings] = useState(() => buildGreetings());
  // Roaming Tilo needs a real ceiling, not a guessed percentage -- this
  // measures where the "Touch to Start" button actually sits on THIS
  // device/viewport, so he can never wander down far enough to block it.
  const [maxRoamY, setMaxRoamY] = useState(40);

  useEffect(() => {
    const measure = () => {
      if (!startButtonRef.current) return;
      const rect = startButtonRef.current.getBoundingClientRect();
      const percent = (rect.top / window.innerHeight) * 100;
      setMaxRoamY(Math.max(10, percent - 6));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    // min-h-dvh, not min-h-screen -- see the App.tsx root wrapper's comment.
    <div className="min-h-dvh bg-navy flex flex-col items-center justify-center p-4">
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="fixed top-4 right-4 bg-navy-light hover:bg-navy-dark rounded-lg transition shadow-lg z-50 border border-navy-dark flex flex-col items-center p-2 gap-0.5"
      >
        <Settings size={18} className="text-offwhite" />
        <span className="text-offwhite text-[9px] font-semibold">Settings</span>
      </button>

      <RoamingMascot lines={greetings} yRangePercent={[2, maxRoamY]} />
      <div className="mb-8">
  <TileSwappyLogo size={150} />
</div>
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Logo/Title with TileSwappy colors */}
        <div className="space-y-4">
          <TileSwappyWordmark sizeClassName="text-4xl sm:text-5xl md:text-6xl" />
          <p className="text-xl text-teal">
            Daily Puzzle Challenge
          </p>
        </div>

        {/* Touch to Start Button with coral/teal gradient */}
        <button
          ref={startButtonRef}
          onClick={onStart}
          className="group relative px-16 py-6 bg-gradient-to-r from-coral to-teal rounded-2xl font-bold text-2xl text-offwhite shadow-coral-glow hover:shadow-teal-glow transform hover:scale-105 transition-all duration-300 active:scale-95 w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-coral-dark to-teal-dark rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative">Touch to Start</span>
        </button>

        {/* Decorative Elements with brand colors */}
        <div className="flex justify-center space-x-4 mt-12">
          <div className="w-4 h-4 bg-coral rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-coral rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Subtle brand tagline */}
        <p className="text-offwhite/60 text-sm mt-8">
          Slide. Solve. Repeat.
        </p>
      </div>
    </div>
  );
};