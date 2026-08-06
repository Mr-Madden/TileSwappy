import React from 'react';
import { CoachMarkTour, TourStep } from './common/CoachMarkTour';
import { useIsDesktopInput } from '../hooks/useIsDesktopInput';

// Swap/Rotate wording (and whether the tiles actually respond) depends on
// whether this is the dedicated practice puzzle -- real interaction is
// only ever safe there, never on a puzzle the player actually cares
// about (see GameboardWalkthroughProps.allowRealInteraction).
function buildBaseSteps(allowRealInteraction: boolean): TourStep[] {
  return [
    {
      title: "Let's look around!",
      text: "This is a real puzzle -- give me a minute to show you what everything on this screen does.",
      expression: 'love'
    },
    {
      target: '[data-tour="tile-grid"]',
      title: 'Swap Tiles',
      text: allowRealInteraction
        ? "Tap two tiles to swap them, or drag one onto another. Try it -- timer's still paused."
        : 'Tap two tiles to swap them, or press and hold one, then drag it onto another.',
      expression: 'happy',
      allowPractice: allowRealInteraction
    },
    {
      target: '[data-tour="tile-grid"]',
      title: 'Rotate Tiles',
      text: allowRealInteraction
        ? "Flick a tile left or right to rotate it. Try it -- still paused."
        : 'Flick a tile left or right to rotate it -- a fast flick, not a slow drag.',
      expression: 'excited',
      allowPractice: allowRealInteraction
    },
    {
      target: '[aria-label="Quit to home"]',
      title: 'Home',
      text: "Tap here anytime to head back to the home menu. I'll check with you first if you've still got progress on this puzzle.",
      expression: 'happy'
    },
    {
      target: '[aria-label="How to play"]',
      title: 'Tutorial',
      text: "This is the button you just tapped to get here! Come back anytime you want this tour again.",
      expression: 'wink'
    },
    {
      target: '[aria-label="Menu"]',
      title: 'Menu',
      text: 'Quick access to your Archive, Stats, and Settings without ever leaving the puzzle.',
      expression: 'thinking'
    },
    {
      target: '[data-tour="stats-row"]',
      title: 'Your Stats',
      text: "Moves, Undos, and Time all tick live as you play. Complete shows how many edges match -- 100% means you've solved it!",
      expression: 'excited'
    },
    {
      target: '[data-tour="zoom-controls"]',
      title: 'Zoom',
      text: "Zoom in for a closer look at tricky details, or back out to see the whole board at once.",
      expression: 'thinking'
    },
    {
      target: '[data-tour="preview-button"]',
      title: 'Peek at the Picture',
      text: "Tap the eye to see a small preview of what the solved puzzle actually looks like -- handy when you're stuck.",
      expression: 'wink'
    },
    {
      target: '[data-tour="hint-button"]',
      title: 'Hint',
      text: "Stuck on a move? I'll suggest a helpful swap or rotation. Your first hint on every puzzle is free!",
      expression: 'happy'
    },
    {
      target: '[data-tour="undo-button"]',
      title: 'Undo',
      text: 'Made a move you regret? Undo takes it right back.',
      expression: 'thinking'
    },
    {
      target: '[data-tour="shuffle-button"]',
      title: 'Shuffle',
      text: "Want a fresh arrangement to work with? Shuffle mixes up every tile's position.",
      expression: 'surprised'
    },
    {
      target: '[data-tour="pause-button"]',
      title: 'Pause',
      text: "This one pauses (and resumes) whenever you need a break -- it says Resume right now since I've already paused things for this tour.",
      expression: 'sleepy'
    },
    {
      target: '[data-tour="restart-button"]',
      title: 'Restart',
      text: 'Want a clean slate? Restart replays this exact puzzle from scratch.',
      expression: 'wink'
    }
  ];
}

// REMOVE FOR iOS BUILD -- see useIsDesktopInput's own comment. A
// touchscreen-only native build has no keyboard/mouse story to explain.
const DESKTOP_STEP: TourStep = {
  title: 'Playing on a Computer?',
  text: 'Tab to the puzzle grid, then use the arrow keys to move between tiles. Enter or Space selects a tile -- select a second to swap them. R rotates clockwise, Shift+R rotates the other way.',
  expression: 'thinking'
};

const OUTRO_STEP: TourStep = {
  title: "That's everything!",
  text: 'Swap and rotate tiles until every edge glows green. Have fun!',
  expression: 'laughing'
};

interface GameboardWalkthroughProps {
  onComplete: () => void;
  /** Toggled true only while a step with allowPractice is showing (Swap/Rotate Tiles) -- lets App.tsx flip on useGameState's practiceMode so those specific tiles actually respond. */
  onPracticeChange: (active: boolean) => void;
  /** True only when the active puzzle is the dedicated practice one -- real interaction during Swap/Rotate Tiles is only ever offered there, never on a puzzle the player actually cares about (a mid-game "How to Play" reopen falls back to pure pointing). */
  allowRealInteraction: boolean;
}

export const GameboardWalkthrough: React.FC<GameboardWalkthroughProps> = ({
  onComplete,
  onPracticeChange,
  allowRealInteraction
}) => {
  // REMOVE FOR iOS BUILD -- gates DESKTOP_STEP above.
  const isDesktopInput = useIsDesktopInput();
  const baseSteps = buildBaseSteps(allowRealInteraction);
  const steps = isDesktopInput ? [...baseSteps, DESKTOP_STEP, OUTRO_STEP] : [...baseSteps, OUTRO_STEP];

  return (
    <CoachMarkTour
      steps={steps}
      onComplete={onComplete}
      onStepChange={(step) => onPracticeChange(!!step.allowPractice)}
    />
  );
};
