import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TileMascot } from './TileMascot/TileMascot';
import type { MascotExpression } from './TileMascot/types';
import './MainMenuWalkthrough.css';

interface WalkthroughStep {
  /** CSS selector for the element to spotlight -- omit for intro/outro steps that just talk to the whole screen. */
  target?: string;
  title: string;
  text: string;
  expression: MascotExpression;
}

const STEPS: WalkthroughStep[] = [
  {
    title: 'Welcome to your home base!',
    text: "I'm Tilo. Give me one minute to show you around.",
    expression: 'love'
  },
  {
    target: '[data-tour="daily-puzzles"]',
    title: 'Daily Puzzles',
    text: "This is today's puzzle. Swipe left or right to browse yesterday's and upcoming ones.",
    expression: 'happy'
  },
  {
    target: '[data-button="archive"]',
    title: 'Archive',
    text: 'Every past puzzle lives here -- browse and replay any of them anytime.',
    expression: 'thinking'
  },
  {
    target: '[data-button="streak"]',
    title: 'Streak',
    text: "Solve a puzzle every day to build your streak -- this is where you'll track it, plus your puzzle calendar.",
    expression: 'excited'
  },
  {
    target: '[data-button="stats"]',
    title: 'Stats',
    text: 'Your best times, move counts, and overall progress show up here.',
    expression: 'happy'
  },
  {
    target: '[aria-label="Settings"]',
    title: 'Settings',
    text: "Themes, sound style, and daily-puzzle notifications all live here -- worth a peek!",
    expression: 'wink'
  },
  {
    target: '[aria-label="How to Play Tutorial"]',
    title: 'Tutorial',
    text: "Forget how any of the controls work? Tap here anytime to see this tutorial again.",
    expression: 'thinking'
  },
  {
    title: 'One more thing...',
    text: "If you're just browsing for a bit, I'll pop up with some quick tips after a little while -- no pressure, just in case you want ideas.",
    expression: 'wink'
  },
  {
    title: "That's the tour!",
    text: 'Go ahead and dive into today\'s puzzle. Have fun!',
    expression: 'laughing'
  }
];

interface MainMenuWalkthroughProps {
  onComplete: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// A lightweight coach-mark tour: four dimming panels around a measured
// target rect (rather than a full backdrop + clip-path/mask) leave a
// natural "cutout" around whichever button Tilo is currently pointing
// at, with no need for canvas or SVG masking. Steps with no target just
// dim the whole screen.
export const MainMenuWalkthrough: React.FC<MainMenuWalkthroughProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSide, setCardSide] = useState<'top' | 'bottom'>('bottom');
  const [maxCardHeight, setMaxCardHeight] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = STEPS[stepIndex];

  useEffect(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(step.target!);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 6;
      setRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step.target]);

  // Whichever side of the spotlighted rect has more room wins, so the card
  // never sits on top of the button/section Tilo is currently describing.
  // The card is then clamped to that side's actual available space (with
  // internal scroll as a fallback) so it can never bleed into the target
  // even when the target itself eats most of a very short viewport.
  useLayoutEffect(() => {
    if (!rect) {
      setCardSide('bottom');
      setMaxCardHeight(null);
      return;
    }
    const margin = 24;
    const cardHeight = cardRef.current?.offsetHeight ?? 190;
    const spaceBelow = window.innerHeight - (rect.top + rect.height) - margin;
    const spaceAbove = rect.top - margin;
    const side = spaceBelow >= cardHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';
    setCardSide(side);
    setMaxCardHeight(Math.max(110, Math.floor(side === 'bottom' ? spaceBelow : spaceAbove)));
  }, [rect, stepIndex]);

  const isLast = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div className="menu-walkthrough">
      {rect ? (
        <>
          <div className="menu-walkthrough-dim" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div
            className="menu-walkthrough-dim"
            style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="menu-walkthrough-dim"
            style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }}
          />
          <div
            className="menu-walkthrough-dim"
            style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }}
          />
          <div
            className="menu-walkthrough-ring"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
        </>
      ) : (
        <div className="menu-walkthrough-dim" style={{ inset: 0 }} />
      )}

      <div
        key={stepIndex}
        ref={cardRef}
        className={`menu-walkthrough-card ${cardSide === 'top' ? 'menu-walkthrough-card--top' : ''}`}
        style={maxCardHeight != null ? { maxHeight: `${maxCardHeight}px` } : undefined}
      >
        <div className="flex items-start gap-3 mb-3">
          <TileMascot size={52} expression={step.expression} color="gold" onClick={() => {}} />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-offwhite mb-1">{step.title}</h3>
            <p className="text-sm text-offwhite/85 leading-relaxed">{step.text}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={handleSkip} className="text-xs text-offwhite/50 hover:text-offwhite/80 transition">
            Skip tour
          </button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`menu-walkthrough-dot ${i === stepIndex ? 'menu-walkthrough-dot--active' : ''}`} />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-coral to-teal text-offwhite font-bold text-sm px-4 py-2 rounded-lg transition hover:opacity-90"
          >
            {isLast ? "Let's go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
