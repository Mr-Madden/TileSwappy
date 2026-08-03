import React, { useEffect, useRef, useState } from 'react';
import { TileMascot } from './TileMascot';
import type { MascotLine } from './types';
import './RoamingMascot.css';

interface RoamingMascotProps {
  lines: MascotLine[];
  size?: number;
  color?: 'coral' | 'teal' | 'gold' | 'violet';
  /** Percentage of viewport height Tilo is allowed to wander into, e.g. [0, 55] keeps him clear of a button/footer sitting in the bottom half. */
  yRangePercent?: [number, number];
}

const pickLine = (lines: MascotLine[], exclude?: string): MascotLine => {
  if (lines.length <= 1) return lines[0] ?? { text: '' };
  let next = lines[Math.floor(Math.random() * lines.length)];
  if (next.text === exclude) {
    next = lines[Math.floor(Math.random() * lines.length)];
  }
  return next;
};

// A free-roaming Tilo for low-stakes screens only (currently just the
// Start Screen) -- same edge-bounce physics as TileSwappyLogo's
// `bouncing` prop, but foreground/opaque/clickable instead of faint
// background wallpaper, and deliberately NOT used anywhere with buttons
// or gameplay he could wander over and block.
export const RoamingMascot: React.FC<RoamingMascotProps> = ({
  lines,
  size = 56,
  color = 'coral',
  yRangePercent = [2, 55]
}) => {
  const [position, setPosition] = useState({ x: 50, y: 20 });
  const velocityRef = useRef({
    x: (Math.random() - 0.5) * 0.5,
    y: (Math.random() - 0.5) * 0.5
  });
  const animationFrameRef = useRef<number | null>(null);
  // Pre-picked (not null) so the very first thing he does on arrival is
  // say something, same as any other Tilo appearance -- a bubble that
  // only ever shows after being poked would mean nobody ever sees the
  // "welcome back" / time-of-day lines this pool can lead with.
  const [line, setLine] = useState<MascotLine | null>(() => pickLine(lines));
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    bubbleTimeoutRef.current = setTimeout(() => setLine(null), 4000);
    return () => clearTimeout(bubbleTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const [minY, maxY] = yRangePercent;

    const animate = () => {
      setPosition((prev) => {
        const maxXPercent = 100 - (size / window.innerWidth) * 100;
        const sizeYPercent = (size / window.innerHeight) * 100;

        let newX = prev.x + velocityRef.current.x;
        let newY = prev.y + velocityRef.current.y;

        if (newX <= 0 || newX >= maxXPercent) velocityRef.current.x *= -1;
        if (newY <= minY || newY >= Math.min(maxY, 100 - sizeYPercent)) velocityRef.current.y *= -1;

        newX = Math.max(0, Math.min(maxXPercent, newX));
        newY = Math.max(minY, Math.min(Math.min(maxY, 100 - sizeYPercent), newY));

        return { x: newX, y: newY };
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const handleClick = () => {
    clearTimeout(bubbleTimeoutRef.current);
    setLine((prev) => pickLine(lines, prev?.text));
    bubbleTimeoutRef.current = setTimeout(() => setLine(null), 2600);
  };

  // Same reasoning as MascotNarrator -- reuses this bubble instead of
  // letting TileMascot render a second one on top of it.
  const handleMilestone = (milestone: MascotLine) => {
    clearTimeout(bubbleTimeoutRef.current);
    setLine(milestone);
    bubbleTimeoutRef.current = setTimeout(() => setLine(null), 3200);
  };

  return (
    <div
      className="roaming-mascot"
      style={{ left: `${position.x}%`, top: `${position.y}%`, width: size, height: size }}
    >
      {line && (
        <div className="roaming-mascot-bubble">
          <p key={line.text} className="roaming-bubble-line">{line.text}</p>
        </div>
      )}
      <TileMascot
        size={size}
        expression={line?.expression ?? 'happy'}
        color={color}
        onClick={handleClick}
        onMilestone={handleMilestone}
      />
    </div>
  );
};
