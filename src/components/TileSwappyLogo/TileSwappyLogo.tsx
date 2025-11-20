// src/components/TileSwappyLogo.tsx

import React, { useState, useEffect } from 'react';

interface TileSwappyLogoProps {
  size?: number;
}

export const TileSwappyLogo: React.FC<TileSwappyLogoProps> = ({ size = 120 }) => {
  const [isSwapped, setIsSwapped] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSwapped(prev => !prev);
    }, 1000); // Swap every .5 seconds

    return () => clearInterval(interval);
  }, []);

  const tileSize = size * 0.35;
  const gap = size * 0.08;

  return (
    <div 
      className="flex items-center justify-center mx-auto"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div 
        className="bg-[#0f1921] rounded-[20px] w-full h-full grid grid-cols-2 grid-rows-2 relative"
        style={{ 
          padding: `${gap}px`,
          gap: `${gap}px`,
        }}
      >
        {/* Tile 1 - Top Left (Off-white) */}
        <div
          className={`bg-offwhite rounded-[15%] shadow-lg transition-all duration-[800ms] ease-[cubic-bezier(0.68,-0.35,0.265,1.35)] ${
            isSwapped ? 'col-start-2 row-start-2 rotate-[-12deg]' : 'col-start-1 row-start-1'
          }`}
          style={{ 
            width: `${tileSize}px`, 
            height: `${tileSize}px`,
          }}
        />

        {/* Tile 2 - Top Right (Off-white with teal marks) */}
        <div
          className={`bg-offwhite rounded-[15%] shadow-lg transition-all duration-[800ms] ease-[cubic-bezier(0.68,-0.35,0.265,1.35)] relative ${
            isSwapped ? 'col-start-1 row-start-2' : 'col-start-2 row-start-1'
          }`}
          style={{ 
            width: `${tileSize}px`, 
            height: `${tileSize}px`,
          }}
        >
          {/* Left teal mark */}
          <div 
            className="absolute bg-teal rounded-full top-1/2 left-[30%] -translate-y-1/2 -rotate-[15deg]"
            style={{
              width: `${tileSize * 0.08}px`,
              height: `${tileSize * 0.2}px`,
            }}
          />
          {/* Right teal mark */}
          <div 
            className="absolute bg-teal rounded-full top-1/2 right-[30%] -translate-y-1/2 rotate-[15deg]"
            style={{
              width: `${tileSize * 0.08}px`,
              height: `${tileSize * 0.2}px`,
            }}
          />
        </div>

        {/* Tile 3 - Bottom Left (Off-white) */}
        <div
          className={`bg-offwhite rounded-[15%] shadow-lg transition-all duration-[800ms] ease-[cubic-bezier(0.68,-0.35,0.265,1.35)] ${
            isSwapped ? 'col-start-2 row-start-1' : 'col-start-1 row-start-2'
          }`}
          style={{ 
            width: `${tileSize}px`, 
            height: `${tileSize}px`,
          }}
        />

        {/* Tile 4 - Bottom Right (Coral, rotated) */}
        <div
          className={`bg-coral rounded-[15%] shadow-lg transition-all duration-[800ms] ease-[cubic-bezier(0.68,-0.35,0.265,1.35)] ${
            isSwapped ? 'col-start-1 row-start-1 rotate-0' : 'col-start-2 row-start-2 rotate-[-12deg]'
          }`}
          style={{ 
            width: `${tileSize}px`, 
            height: `${tileSize}px`,
          }}
        />
      </div>
    </div>
  );
};