import { useEffect, useState } from 'react';

// True for devices whose primary pointer is a mouse/trackpad (a real
// "desktop" input surface) rather than touch -- used to gate desktop-only
// UI, like keyboard-control hints, that would be meaningless on a phone.
//
// REMOVE FOR iOS BUILD: once TileSwappy ships as a native iOS app, every
// caller gating content behind this hook should be cut entirely rather
// than just left to evaluate false at runtime -- there's no keyboard/
// mouse story worth explaining to a player who's always on a touchscreen.
export function useIsDesktopInput(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: fine)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(pointer: fine)');
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
