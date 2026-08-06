import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TileMascot } from '../TileMascot/TileMascot';
import type { MascotExpression } from '../TileMascot/types';
import './CoachMarkTour.css';

export interface TourStep {
  /** CSS selector for the element to spotlight -- omit for intro/outro steps that just talk to the whole screen. */
  target?: string;
  title: string;
  text: string;
  expression: MascotExpression;
  /** When true, the spotlight ring lets clicks/taps pass through to the real element underneath instead of intercepting them (its usual job, so the tour can't be short-circuited by tapping what's being explained) -- also forwarded via onStepChange so a consumer (e.g. GameboardWalkthrough) can react to it, like flipping on real gameplay interaction for a "try it" step. */
  allowPractice?: boolean;
}

interface CoachMarkTourProps {
  steps: TourStep[];
  onComplete: () => void;
  /** Fires on mount and every step change -- lets a consumer react to which step is now showing (e.g. toggling practiceMode while a "try it" step is up). */
  onStepChange?: (step: TourStep, index: number) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// A lightweight coach-mark tour: four dimming panels around a measured
// target rect (rather than a full backdrop + clip-path/mask) leave a
// natural "cutout" around whichever element Tilo is currently pointing
// at, with no need for canvas or SVG masking. Steps with no target just
// dim the whole screen. Shared by MainMenuWalkthrough and
// GameboardWalkthrough -- extracted once a second real tour needed the
// exact same dynamic card-positioning logic (see below) rather than a
// second copy that could drift out of sync with the first's bugfixes.
export const CoachMarkTour: React.FC<CoachMarkTourProps> = ({ steps, onComplete, onStepChange }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSide, setCardSide] = useState<'top' | 'bottom'>('bottom');
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[stepIndex];

  useEffect(() => {
    onStepChange?.(step, stepIndex);
    // onStepChange intentionally excluded -- callers pass an inline
    // closure, so including it would refire on every render instead of
    // only on real step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stepIndex]);

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

  // Whichever side of the spotlighted rect has more room wins -- a
  // preference, not a hard requirement. Covering part of a large target
  // (the tile grid, mainly) is fine; this just picks the less-cramped
  // side rather than fighting to avoid overlap entirely, which used to
  // force the card down to an awkward, scrolling minimum height.
  useLayoutEffect(() => {
    if (!rect) {
      setCardSide('bottom');
      return;
    }
    const margin = 16;
    const cardHeight = cardRef.current?.offsetHeight ?? 190;
    const spaceBelow = window.innerHeight - (rect.top + rect.height) - margin;
    const spaceAbove = rect.top - margin;
    setCardSide(spaceBelow >= cardHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top');
  }, [rect, stepIndex]);

  const isLast = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div className="coach-mark-tour">
      {rect ? (
        <>
          <div className="coach-mark-dim" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div
            className="coach-mark-dim"
            style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="coach-mark-dim"
            style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }}
          />
          <div
            className="coach-mark-dim"
            style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }}
          />
          <div
            className="coach-mark-ring"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              // The ring normally intercepts clicks so the tour can't be
              // short-circuited by tapping the thing being explained --
              // allowPractice steps want the opposite: real taps/drags
              // need to reach the actual element underneath.
              pointerEvents: step.allowPractice ? 'none' : undefined
            }}
          />
        </>
      ) : (
        <div className="coach-mark-dim" style={{ inset: 0 }} />
      )}

      <div
        key={stepIndex}
        ref={cardRef}
        className={`coach-mark-card ${cardSide === 'top' ? 'coach-mark-card--top' : ''}`}
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
            {steps.map((_, i) => (
              <div key={i} className={`coach-mark-dot ${i === stepIndex ? 'coach-mark-dot--active' : ''}`} />
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
