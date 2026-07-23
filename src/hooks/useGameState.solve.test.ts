import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { FactoryTile } from '../models/types';

// End-to-end regression test for the full solve pipeline through the real
// hook (not just the pure GameLogicService functions in isolation) --
// covers startGame's shuffle, swapTiles, and the win-detection path all
// wired together exactly as real gameplay invokes them. Written to
// diagnose a reported "no celebration after solving" bug -- if this
// fails, the regression is in useGameState; if it passes, it's elsewhere
// (App.tsx's completion-detection effect, or the UI layer).
describe('useGameState full solve', () => {
  beforeAll(() => {
    // jsdom (this project's Jest test environment) doesn't provide
    // crypto.randomUUID at all -- real browsers always do in a secure
    // context (localhost/HTTPS), so this is purely a test-environment
    // gap, not something buildTilesFromFactoryData needs to guard
    // against at runtime.
    if (typeof (global as any).crypto === 'undefined') {
      (global as any).crypto = {};
    }
    if (typeof (global as any).crypto.randomUUID !== 'function') {
      let counter = 0;
      (global as any).crypto.randomUUID = () => `test-uuid-${counter++}`;
    }
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reaches status "solved" once every tile is back in its correct position', () => {
    // Easy always generates rotation 0 (PuzzleGenerationService.generateRotation),
    // so only position needs sorting here, not rotation.
    const factoryTiles: FactoryTile[] = Array.from({ length: 9 }, (_, i) => ({
      tileIndex: i,
      imageUrl: `tile-${i}.png`,
      correctPosition: i,
      correctRotation: 0
    }));

    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.startGame({
        id: 'test-puzzle',
        title: 'Test',
        difficulty: 'Easy',
        gradient: ['#fff', '#000', '#000'],
        tiles: factoryTiles
      } as any);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.gameState.status).toBe('playing');
    expect(result.current.gameState.tiles).toHaveLength(9);

    // Selection-sort the shuffled tiles back into their original row/col
    // via repeated swapTiles calls -- the exact same call real gameplay
    // (drag-and-drop / tap-to-swap) uses.
    for (let targetIndex = 0; targetIndex < 9; targetIndex++) {
      const targetRow = Math.floor(targetIndex / 3);
      const targetCol = targetIndex % 3;

      const tiles = result.current.gameState.tiles;
      const tileAlreadyThere = tiles.find(t => t.row === targetRow && t.col === targetCol)!;

      if (tileAlreadyThere.originalRow === targetRow && tileAlreadyThere.originalCol === targetCol) {
        continue;
      }

      const correctTile = tiles.find(
        t => t.originalRow === targetRow && t.originalCol === targetCol
      )!;

      act(() => {
        result.current.swapTiles(correctTile.id, tileAlreadyThere.id);
      });
    }

    expect(result.current.gameState.tiles.every(t => t.row === t.originalRow && t.col === t.originalCol)).toBe(true);
    expect(result.current.gameState.status).toBe('solved');
  });
});
