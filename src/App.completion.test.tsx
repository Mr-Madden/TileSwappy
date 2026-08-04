import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

// Smoke-tests the UI layer the hook-level useGameState.solve.test.ts
// explicitly can't reach: whether App.tsx's own completion-detection
// effect actually renders the "Puzzle Solved!" screen once a real puzzle
// is driven to solved status through the rendered UI (not just through
// the hook directly). Drives an Easy (rotation-free) Factory puzzle
// through tap-to-select-swap gestures on the real DOM.
jest.mock('./services/supabase', () => ({
  getWeekPuzzles: jest.fn(),
  getMonthPuzzles: jest.fn(async () => []),
  getFactoryPuzzlesForDateRange: jest.fn(async () => []),
  getScheduleForDateRange: jest.fn(async () => []),
  isPuzzleUnlocked: jest.fn(() => true),
  getDailyPuzzle: jest.fn(async () => null)
}));

const GRID_SIZE = 3;

function todayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildFactoryTiles() {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    tileIndex: i,
    imageUrl: '',
    correctPosition: i,
    correctRotation: 0
  }));
}

describe('App completion screen', () => {
  beforeAll(() => {
    if (typeof (global as any).crypto === 'undefined') {
      (global as any).crypto = {};
    }
    if (typeof (global as any).crypto.randomUUID !== 'function') {
      let counter = 0;
      (global as any).crypto.randomUUID = () => `test-uuid-${counter++}`;
    }

    // useTileDragGesture calls setPointerCapture on every pointerdown --
    // a real browser API jsdom doesn't implement.
    (Element.prototype as any).setPointerCapture = jest.fn();
    (Element.prototype as any).releasePointerCapture = jest.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    // Skips the onboarding tutorial + menu walkthrough entirely -- those
    // are already covered by manual verification earlier in this project;
    // this test's only job is the completion screen.
    localStorage.setItem('tutorialCompleted', 'true');

    // CRA's Jest config runs with resetMocks: true, which wipes a
    // jest.fn()'s implementation (not just its call history) before
    // every test -- setting this up in beforeAll instead of here left
    // window.matchMedia() silently returning undefined by the time the
    // test body ran. jsdom has no real implementation of its own;
    // ThemeBackground/RoamingMascot/etc check `matchMedia(...).matches`
    // defensively at runtime, so this just needs to be callable.
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    })) as any;

    const supabaseMock = require('./services/supabase');
    supabaseMock.getWeekPuzzles.mockResolvedValue([
      {
        date: todayDateStr(),
        title: 'Test Puzzle',
        difficulty: 'Easy',
        gradient: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        tiles: buildFactoryTiles()
      }
    ]);
  });

  // Taps a tile via the same pointerdown/up cycle useTileDragGesture
  // listens for -- with no pointermove between them, dx/dy stay 0, which
  // resolves to the tap gesture (select on the first tap, swap on the
  // second) exactly like a real quick tap would.
  //
  // Dispatched as MouseEvents *named* pointerdown/pointerup rather than
  // through fireEvent.pointerDown/pointerUp: this project's jsdom has no
  // PointerEvent constructor, and testing-library's fallback for an
  // unrecognized event type drops clientX/clientY entirely. A MouseEvent
  // has real, working clientX/clientY getters in this jsdom; React's
  // event system only keys off event.type to route it to the
  // onPointerDown/onPointerUp props, so naming it that way is enough.
  const tapTile = (el: Element) => {
    const down = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 });
    (down as any).pointerId = 1;
    el.dispatchEvent(down);

    const up = new MouseEvent('pointerup', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 });
    (up as any).pointerId = 1;
    el.dispatchEvent(up);
  };

  it('shows the completion screen once every tile is swapped into place', async () => {
    jest.useFakeTimers();
    try {
      render(<App />);

      // Start screen -> home (tutorial already marked complete above).
      fireEvent.click(await screen.findByText(/touch to start/i));
      act(() => {
        jest.advanceTimersByTime(500);
      });

      const puzzleCard = await screen.findByText('TODAY');
      fireEvent.click(puzzleCard.closest('button')!);

      // Pre-match countdown: 3 -> 2 -> 1 -> go, each tick on its own 1s
      // timer, chained one setTimeout at a time inside the countdown's
      // own effect -- advanced a full second at a time (rather than one
      // big jump) so each state update + effect re-run gets its own
      // flush.
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }

      expect(document.querySelectorAll('[data-tile-id]').length).toBe(GRID_SIZE * GRID_SIZE);

      // Each tile's id is predictable (test-uuid-<factory index>, since
      // buildTilesFromFactoryData maps the input array in order); its
      // actual shuffled grid position comes straight off the inline
      // style React set. Swap tiles into place until every one matches
      // its own factory index (row = floor(i/3), col = i%3).
      const readPositions = () => {
        const els = Array.from(document.querySelectorAll('[data-tile-id]')) as HTMLElement[];
        return els.map((el) => {
          const id = el.getAttribute('data-tile-id')!;
          const index = parseInt(id.replace('test-uuid-', ''), 10);
          const row = parseInt(el.style.gridRow, 10) - 1;
          const col = parseInt(el.style.gridColumn, 10) - 1;
          return { el, index, row, col };
        });
      };

      const at = (row: number, col: number) => readPositions().find((t) => t.row === row && t.col === col)!;

      for (let targetIndex = 0; targetIndex < GRID_SIZE * GRID_SIZE; targetIndex++) {
        const targetRow = Math.floor(targetIndex / GRID_SIZE);
        const targetCol = targetIndex % GRID_SIZE;
        const current = readPositions().find((t) => t.index === targetIndex)!;

        if (current.row === targetRow && current.col === targetCol) {
          continue;
        }

        const occupant = at(targetRow, targetCol);

        act(() => {
          tapTile(current.el);
        });
        act(() => {
          tapTile(occupant.el);
        });
      }

      expect(screen.getByText(/puzzle solved/i)).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  }, 20000);
});
