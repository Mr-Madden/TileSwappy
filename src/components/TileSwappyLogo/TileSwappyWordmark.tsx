import React, { useEffect, useRef, useState } from 'react';
import './TileSwappyWordmark.css';

const TITLE = 'TileSwappy';

interface TileSwappyWordmarkProps {
  /** Tailwind font-size class -- callers size it to their own layout (StartScreen's hero title vs HomeScreen's smaller header). */
  sizeClassName?: string;
  className?: string;
}

// The "TileSwappy" wordmark with a per-letter touch ripple -- originally
// StartScreen-only, now shared so HomeScreen can show the same wordmark
// with the same interaction instead of a second copy of this logic.
export const TileSwappyWordmark: React.FC<TileSwappyWordmarkProps> = ({
  sizeClassName = 'text-6xl',
  className = ''
}) => {
  const [ripple, setRipple] = useState<{ origin: number; key: number } | null>(null);
  const rippleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(rippleTimeout.current), []);

  const triggerRipple = (index: number) => {
    clearTimeout(rippleTimeout.current);
    setRipple({ origin: index, key: Date.now() });
    // Ripple has to outlive the farthest letter's staggered start (90ms
    // per step) plus its own 1.05s pop, or that letter's class gets reset
    // mid-animation and snaps back to idle-bob with a visible jump-cut.
    const maxDistance = Math.max(index, TITLE.length - 1 - index);
    rippleTimeout.current = setTimeout(() => setRipple(null), maxDistance * 90 + 1050);
  };

  return (
    <h1 className={`title-letters font-bold text-offwhite drop-shadow-lg ${sizeClassName} ${className}`}>
      {TITLE.split('').map((char, index) => {
        const distance = ripple ? Math.abs(index - ripple.origin) : 0;
        const style: React.CSSProperties = ripple
          ? {
              animationDelay: `${distance * 0.09}s`,
              ['--letter-spin' as any]: index % 2 === 0 ? '360deg' : '-360deg',
              ['--letter-pop-color' as any]: index % 2 === 0 ? 'var(--color-coral)' : 'var(--color-teal)'
            }
          : { animationDelay: `${index * 0.12}s` };

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
  );
};
