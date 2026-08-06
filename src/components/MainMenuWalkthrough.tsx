import React from 'react';
import { CoachMarkTour, TourStep } from './common/CoachMarkTour';

const STEPS: TourStep[] = [
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

export const MainMenuWalkthrough: React.FC<MainMenuWalkthroughProps> = ({ onComplete }) => (
  <CoachMarkTour steps={STEPS} onComplete={onComplete} />
);
