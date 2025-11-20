// src/components/StartScreen.tsx

import React from 'react';
import { TileSwappyLogo } from '../TileSwappyLogo/TileSwappyLogo';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">
      <div className="mb-8">
  <TileSwappyLogo size={150} />
</div>
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Logo/Title with TileSwappy colors */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-offwhite drop-shadow-lg">
            TileSwappy
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