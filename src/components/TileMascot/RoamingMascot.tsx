import React, { useEffect, useRef, useState } from 'react';
import { TileMascot } from './TileMascot';
import { MascotBubbleText } from './MascotBubbleText';
import { useIdleTics } from './useIdleTics';
import type { MascotLine } from './types';
import './RoamingMascot.css';

interface RoamingMascotProps {
  lines: MascotLine[];
  size?: number;
  color?: 'coral' | 'teal' | 'gold' | 'violet';
  /** Percentage of viewport height Tilo is allowed to wander into, e.g. [0, 55] keeps him clear of a button/footer sitting in the bottom half. */
  yRangePercent?: [number, number];
  /** Faded out and paused in place (not unmounted, so his position/velocity survive) whenever a modal, walkthrough, or other scripted Tilo moment is on screen -- avoids two Tilos ever being visible at once. */
  hidden?: boolean;
}

const pickLine = (lines: MascotLine[], exclude?: string): MascotLine => {
  if (lines.length <= 1) return lines[0] ?? { text: '' };
  let next = lines[Math.floor(Math.random() * lines.length)];
  if (next.text === exclude) {
    next = lines[Math.floor(Math.random() * lines.length)];
  }
  return next;
};

// A free-roaming Tilo -- same edge-bounce physics as TileSwappyLogo's
// `bouncing` prop, but foreground/opaque/clickable instead of faint
// background wallpaper. Meant to be mounted ONCE, high enough in the tree
// that switching screens (Home <-> Archive <-> gameboard <-> Settings)
// never remounts it -- otherwise every navigation would reset his
// position and restart his velocity, which reads as him "teleporting"
// rather than actually wandering the app.
export const RoamingMascot: React.FC<RoamingMascotProps> = ({
  lines,
  size = 56,
  color = 'coral',
  yRangePercent = [10, 90],
  hidden = false
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
  const wasHiddenRef = useRef(hidden);

  useEffect(() => {
    bubbleTimeoutRef.current = setTimeout(() => setLine(null), 4000);
    return () => clearTimeout(bubbleTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coming back from behind a modal/walkthrough is treated like a fresh
  // arrival -- picks a new line and says hi again, same as first mount.
  useEffect(() => {
    if (wasHiddenRef.current && !hidden) {
      clearTimeout(bubbleTimeoutRef.current);
      setLine(pickLine(lines));
      bubbleTimeoutRef.current = setTimeout(() => setLine(null), 4000);
    }
    wasHiddenRef.current = hidden;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  useEffect(() => {
    // Paused (no rAF scheduled) rather than unmounted while hidden -- his
    // position/velocity are preserved so he resumes from wherever he was
    // instead of snapping back to center.
    if (hidden) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const [minY, maxY] = yRangePercent;

    // No obstacle-avoidance here on purpose -- he used to bounce off the
    // gameboard's tile grid to stay clear of it, which squeezed his whole
    // roam range down to whatever margin was left around the board. By
    // request, he now roams the full screen freely and simply passes
    // BEHIND the puzzle when their paths cross (see the tile grid's
    // z-index in GameBoard.tsx, kept just above .roaming-mascot's).
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
  }, [size, hidden]);

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

  const ticClass = useIdleTics(!hidden);

  return (
    <div
      className={`roaming-mascot ${hidden ? 'roaming-mascot--hidden' : ''}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, width: size, height: size }}
      aria-hidden={hidden}
    >
      {line && !hidden && (
        <div className="roaming-mascot-bubble">
          <p key={line.text} className="roaming-bubble-line">
            <MascotBubbleText text={line.text} />
          </p>
        </div>
      )}
      <TileMascot
        size={size}
        expression={line?.expression ?? 'happy'}
        color={color}
        className={ticClass}
        onClick={handleClick}
        onMilestone={handleMilestone}
      />
    </div>
  );
};
