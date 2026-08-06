import React, { useEffect, useRef, useState } from 'react';
import { useMascotSound } from './useMascotSound';

interface MascotBubbleTextProps {
  text: string;
  className?: string;
}

// Reveals a line word-by-word with a soft "blip" per word instead of
// popping in all at once -- the cheap, classic talking illusion (Animal
// Crossing, Banjo-Kazooie) instead of real voice acting or a paid TTS
// service. Reuses the existing synthesized sound system (one more
// SoundName), so it costs nothing ongoing and respects the same
// enabled/style/volume settings every other sound already does.
export const MascotBubbleText: React.FC<MascotBubbleTextProps> = ({ text, className }) => {
  const [shownWords, setShownWords] = useState(0);
  const playSound = useMascotSound();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    const words = text.split(' ').filter(Boolean);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || words.length === 0) {
      setShownWords(words.length);
      return;
    }

    setShownWords(0);
    let i = 0;
    const revealNext = () => {
      i++;
      setShownWords(i);
      playSound('mascotBlip');
      if (i < words.length) {
        timeoutRef.current = setTimeout(revealNext, 70 + Math.random() * 55);
      }
    };
    timeoutRef.current = setTimeout(revealNext, 40);

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const words = text.split(' ').filter(Boolean);
  return <span className={className}>{words.slice(0, shownWords).join(' ')}</span>;
};
