import React, { useState, useEffect, useRef } from 'react';

interface BouncingTileSwappyLogoProps {
  size?: number;
}

export const BouncingTileSwappyLogo: React.FC<BouncingTileSwappyLogoProps> = ({ size = 120 }) => {
  const [isSwapped, setIsSwapped] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const velocityRef = useRef({ 
    x: (Math.random() - 0.5) * 0.3, 
    y: (Math.random() - 0.5) * 0.3 
  });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSwapped(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const newX = prev.x + velocityRef.current.x;
        const newY = prev.y + velocityRef.current.y;

        // Bounce off edges
        if (newX <= 0 || newX >= 100 - (size / window.innerWidth * 100)) {
          velocityRef.current.x *= -1;
        }
        if (newY <= 0 || newY >= 100 - (size / window.innerHeight * 100)) {
          velocityRef.current.y *= -1;
        }

        return {
          x: Math.max(0, Math.min(100 - (size / window.innerWidth * 100), newX)),
          y: Math.max(0, Math.min(100 - (size / window.innerHeight * 100), newY))
        };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size]);

  const tileSize = size * 0.35;
  const gap = size * 0.08;

  return (
    <div 
      className="bouncing-logo"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        left: `${position.x}%`,
        top: `${position.y}%`,
        transition: 'none'
      }}
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
          <div 
            className="absolute bg-teal rounded-full top-1/2 left-[30%] -translate-y-1/2 -rotate-[15deg]"
            style={{
              width: `${tileSize * 0.08}px`,
              height: `${tileSize * 0.2}px`,
            }}
          />
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