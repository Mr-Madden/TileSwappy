import React, { useState } from 'react';
import { TileMascot } from './TileMascot';
import { MascotBubbleText } from './MascotBubbleText';
import { useIdleTics } from './useIdleTics';
import type { MascotExpression, MascotLine } from './types';
import './MascotNarrator.css';

export type { MascotLine } from './types';

interface MascotNarratorProps {
  /** A pool of things Tilo might say -- one is picked at random on mount, and clicking him cycles to another. Plain strings use the narrator's default `expression`; pass a MascotLine to pair a specific line with its own expression. */
  lines: (string | MascotLine)[];
  expression?: MascotExpression;
  size?: number;
  color?: 'coral' | 'teal' | 'gold' | 'violet';
  /** 'row' puts the bubble beside Tilo (wide screens); 'column' stacks the bubble under him (narrow/mobile). */
  layout?: 'row' | 'column';
  className?: string;
}

const normalize = (line: string | MascotLine): MascotLine =>
  typeof line === 'string' ? { text: line } : line;

const pickLine = (lines: (string | MascotLine)[], exclude?: string): MascotLine => {
  const normalized = lines.map(normalize);
  if (normalized.length <= 1) return normalized[0] ?? { text: '' };
  let next = normalized[Math.floor(Math.random() * normalized.length)];
  // Re-roll once on an immediate repeat -- not worth a full loop over a
  // short list just to guarantee variety, but worth avoiding the most
  // noticeable case (tap Tilo, he says the exact same thing again).
  if (next.text === exclude) {
    next = normalized[Math.floor(Math.random() * normalized.length)];
  }
  return next;
};

// Tilo plus a speech bubble -- the actual "narrator" unit used wherever
// he's meant to be saying something, as opposed to just standing around
// (a bare TileMascot, e.g. the milestone screen where the message lives
// in its own heading instead). Clicking/tapping Tilo himself cycles to a
// different line from the pool, so he isn't just a static illustration.
export const MascotNarrator: React.FC<MascotNarratorProps> = ({
  lines,
  expression = 'happy',
  size = 64,
  color = 'coral',
  layout = 'row',
  className = ''
}) => {
  const [current, setCurrent] = useState(() => pickLine(lines));

  const handleClick = () => {
    setCurrent((prev) => pickLine(lines, prev.text));
  };

  // Takes over the SAME bubble that already exists here rather than
  // letting TileMascot render its own -- two bubbles stacking up at
  // once read as a layout bug, not a bonus.
  const handleMilestone = (milestone: MascotLine) => {
    setCurrent(milestone);
    setTimeout(() => {
      setCurrent((prev) => (prev.text === milestone.text ? pickLine(lines, prev.text) : prev));
    }, 3200);
  };

  const ticClass = useIdleTics(true);

  return (
    <div className={`mascot-narrator mascot-narrator--${layout} ${className}`}>
      <TileMascot
        size={size}
        expression={current.expression ?? expression}
        color={color}
        className={ticClass}
        onClick={handleClick}
        onMilestone={handleMilestone}
      />
      <div className="mascot-bubble">
        <p key={current.text} className="mascot-bubble-line">
          <MascotBubbleText text={current.text} />
        </p>
      </div>
    </div>
  );
};
