import React from 'react';

interface ConfettiBurstProps {
  count?: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C77DFF'];
const SHAPES = ['circle', 'square', 'diamond'] as const;

// Shared by the regular completion screen and the streak-milestone
// celebration -- self-contained (brings its own keyframes) so either
// screen can drop it in without needing the other's <style> block.
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ count = 70 }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(count)].map((_, i) => {
      const shape = SHAPES[i % 3];
      const size = 8 + Math.floor(Math.random() * 8);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return (
        <div
          key={i}
          className={`absolute confetti-piece ${shape === 'circle' ? 'rounded-full' : shape === 'diamond' ? 'rotate-45' : ''}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: size,
            height: size,
            backgroundColor: color,
            animationDelay: `${Math.random() * 0.6}s`,
            animationDuration: `${1.8 + Math.random() * 2.2}s`
          }}
        />
      );
    })}
    <style>{`
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      .confetti-piece {
        animation: confetti-fall linear forwards;
      }
    `}</style>
  </div>
);
