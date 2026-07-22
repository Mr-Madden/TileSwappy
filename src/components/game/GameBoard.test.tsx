import React from 'react';
import { render } from '@testing-library/react';
import { GameBoard, Tile } from './GameBoard';
import { GameLogicService } from '../../services/GameLogicService';

// Regression coverage for the edge-match glow: GameBoard used to look
// up matchingEdges.has(tile.id) -- a value the Set never contained
// (checkEdgeMatches keys it by seam, not by tile id) -- so the glow
// never rendered for any puzzle. These tests exercise the fixed,
// grid-level seam overlay directly against the component.

function makeTiles(overrides: Partial<Tile>[] = []): Tile[] {
  const tiles: Tile[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      tiles.push({
        id: `tile-${index}`,
        row,
        col,
        rotation: 0,
        ...overrides[index]
      });
    }
  }
  return tiles;
}

const noop = () => {};

function renderBoard(tiles: Tile[], matchingEdges: Set<string>) {
  return render(
    <GameBoard
      tiles={tiles}
      selectedTile={null}
      matchingEdges={matchingEdges}
      onSelectTile={noop}
      onRotateTile={noop}
      onSwapTiles={noop}
      onUndo={noop}
      onShuffle={noop}
      onPause={noop}
      onRestart={noop}
      canUndo={false}
      isPaused={false}
    />
  );
}

describe('GameBoard seam-match glow', () => {
  it('renders no glow bars when nothing matches', () => {
    const { container } = renderBoard(makeTiles(), new Set());
    expect(container.querySelectorAll('.animate-pulse.bg-match').length).toBe(0);
  });

  it('renders exactly one glow bar per matched seam', () => {
    const matches = new Set([
      GameLogicService.seamKey(0, 0, 'right'),
      GameLogicService.seamKey(1, 1, 'bottom')
    ]);
    const { container } = renderBoard(makeTiles(), matches);
    expect(container.querySelectorAll('.animate-pulse.bg-match').length).toBe(2);
  });

  it('positions a matched seam the same regardless of either tile\'s own rotation', () => {
    const matches = new Set([GameLogicService.seamKey(0, 0, 'right')]);

    const unrotated = renderBoard(makeTiles(), matches);
    const unrotatedBar = unrotated.container.querySelector('.animate-pulse.bg-match') as HTMLElement;
    const unrotatedLeft = unrotatedBar.style.left;
    const unrotatedTop = unrotatedBar.style.top;
    unrotated.unmount();

    // Rotate the tile at (0,0) -- if the glow were (incorrectly) a
    // child of that tile's own rotating div, this would move the bar.
    // As a grid-level overlay, it must not.
    const rotatedTiles = makeTiles([{ rotation: 90 }]);
    const rotated = renderBoard(rotatedTiles, matches);
    const rotatedBar = rotated.container.querySelector('.animate-pulse.bg-match') as HTMLElement;

    expect(rotatedBar.style.left).toBe(unrotatedLeft);
    expect(rotatedBar.style.top).toBe(unrotatedTop);
  });
});
