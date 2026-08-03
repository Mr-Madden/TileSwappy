import React from 'react';

interface ConfettiBurstProps {
  count?: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C77DFF'];
const SHAPES = ['circle', 'square', 'diamond', 'star'] as const;
const STAR_CLIP =
  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

// Shared by the regular completion screen and the streak-milestone
// celebration -- self-contained (brings its own keyframes) so either
// screen can drop it in without needing the other's <style> block.
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ count = 70 }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(count)].map((_, i) => {
      const shape = SHAPES[i % 4];
      const size = 8 + Math.floor(Math.random() * 8);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const drift = Math.round((Math.random() - 0.5) * 140);
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
            clipPath: shape === 'star' ? STAR_CLIP : undefined,
            ['--confetti-drift' as string]: `${drift}px`,
            animationDelay: `${Math.random() * 0.6}s`,
            animationDuration: `${1.8 + Math.random() * 2.2}s`
          }}
        />
      );
    })}
    <style>{`
      @keyframes confetti-fall {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
        60% { opacity: 1; }
        100% { transform: translate(var(--confetti-drift), 100vh) rotate(720deg); opacity: 0; }
      }
      .confetti-piece {
        animation: confetti-fall linear forwards;
      }

      @media (prefers-reduced-motion: reduce) {
        .confetti-piece {
          display: none;
        }
      }
    `}</style>
  </div>
);
