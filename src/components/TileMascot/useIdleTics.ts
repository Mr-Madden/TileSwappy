import { useEffect, useRef, useState } from 'react';

const TIC_CLASSES = ['mascot-tic-tilt', 'mascot-tic-shiver'] as const;

// A small "he's alive" flourish -- an occasional head-tilt/shiver even
// when nobody's interacting with him, layered on top of the constant
// mascot-bounce float every TileMascot already does. Self-scheduling with
// a randomized gap (not a fixed interval) so multiple Tilo instances on
// screen at once (e.g. the roaming companion plus a modal's own Tilo)
// don't all twitch in perfect lockstep.
export function useIdleTics(active: boolean): string {
  const [tic, setTic] = useState<string | null>(null);
  const scheduleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!active) {
      setTic(null);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 7000;
      scheduleTimeoutRef.current = setTimeout(() => {
        setTic(TIC_CLASSES[Math.floor(Math.random() * TIC_CLASSES.length)]);
        clearTimeoutRef.current = setTimeout(() => setTic(null), 750);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      clearTimeout(scheduleTimeoutRef.current);
      clearTimeout(clearTimeoutRef.current);
    };
  }, [active]);

  return tic ?? '';
}
