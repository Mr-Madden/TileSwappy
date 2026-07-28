// src/components/StartScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import { TileSwappyLogo } from '../TileSwappyLogo/TileSwappyLogo';
import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
}

const TITLE = 'TileSwappy';

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [ripple, setRipple] = useState<{ origin: number; key: number } | null>(null);
  const rippleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(rippleTimeout.current), []);

  const triggerRipple = (index: number) => {
    clearTimeout(rippleTimeout.current);
    setRipple({ origin: index, key: Date.now() });
    // Ripple has to outlive the farthest letter's staggered start (60ms
    // per step) plus its own 0.7s pop, or that letter's class gets reset
    // mid-animation and snaps back to idle-bob with a visible jump-cut.
    const maxDistance = Math.max(index, TITLE.length - 1 - index);
    rippleTimeout.current = setTimeout(() => setRipple(null), maxDistance * 60 + 700);
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">
      <div className="mb-8">
  <TileSwappyLogo size={150} />
</div>
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Logo/Title with TileSwappy colors */}
        <div className="space-y-4">
          <h1 className="title-letters text-6xl font-bold text-offwhite drop-shadow-lg">
            {TITLE.split('').map((char, index) => {
              const distance = ripple ? Math.abs(index - ripple.origin) : 0;
              const style: React.CSSProperties = ripple
                ? {
                    animationDelay: `${distance * 0.06}s`,
                    ['--letter-spin' as any]: index % 2 === 0 ? '360deg' : '-360deg',
                    ['--letter-pop-color' as any]: index % 2 === 0 ? 'var(--color-coral)' : 'var(--color-teal)',
                  }
                : { animationDelay: `${index * 0.08}s` };

              return (
                <span
                  key={ripple ? `${index}-${ripple.key}` : index}
                  className={`letter ${ripple ? 'letter-splash' : ''}`}
                  style={style}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerRipple(index);
                  }}
                >
                  {char}
                </span>
              );
            })}
          </h1>
          <p className="text-xl text-teal">
            Daily Puzzle Challenge
          </p>
        </div>

        {/* Touch to Start Button with coral/teal gradient */}
        <button
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