// src/components/game/GameBoard.tsx
import React, { useState, useRef } from 'react';

export type Rotation = 0 | 90 | 180 | 270;

export interface Tile {
  id: string;
  row: number;
  col: number;
  originalRow?: number;
  originalCol?: number;
  imageData?: string;
  rotation?: Rotation;
  // other fields are allowed but optional for this component
  [key: string]: any;
}

interface GameBoardProps {
  tiles: Tile[];
  selectedTile: string | null;
  matchingEdges: Set<string>;
  onTileInteraction: (tileId: string, deltaX: number, deltaY: number) => void;
  onUndo: () => void;
  onShuffle: () => void;
  onPause: () => void;
  onRestart: () => void;
  canUndo: boolean;
  isPaused: boolean;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

type Point = {
  x: number;
  y: number;
};

export const GameBoard: React.FC<GameBoardProps> = ({
  tiles,
  selectedTile,
  matchingEdges,
  onTileInteraction,
  onUndo,
  onShuffle,
  onPause,
  onRestart,
  canUndo,
  isPaused,
  zoomLevel = 1,
  onZoomIn,
  onZoomOut
}) => {
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number; tileId: string } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };
    }
    // MouseEvent
    const me = e as React.MouseEvent;
    return {
      x: me.clientX,
      y: me.clientY
    };
  };

  // --- copy start: handleDown ---
  const handleDown = (
    e: React.MouseEvent | React.TouchEvent,
    tileId: string
  ) => {
    // Prevent default to avoid page scrolling on touch devices
    e.preventDefault();

    const p = getPoint(e);

    setSwipeStart({
      x: p.x,
      y: p.y,
      tileId
    });
  };
  // --- copy end: handleDown ---

  // --- copy start: handleUp ---
  const handleUp = (
    e: React.MouseEvent | React.TouchEvent,
    tileId: string
  ) => {
    e.preventDefault();

    const p = getPoint(e);

    if (!swipeStart) {
      // No start point recorded; treat as a tap (zero delta)
      onTileInteraction(tileId, 0, 0);
      return;
    }

    // Only proceed if the tileId matches the one that started the swipe.
    // If not, still compute delta relative to the start point.
    const deltaX = p.x - swipeStart.x;
    const deltaY = p.y - swipeStart.y;

    // Clear swipe start
    setSwipeStart(null);

    // Delegate to parent handler
    onTileInteraction(tileId, deltaX, deltaY);
  };
  // --- copy end: handleUp ---

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    // Prevent default while dragging on touch devices to avoid scrolling
    if ('changedTouches' in e) {
      e.preventDefault();
    }
  };

  // Tiles must be explicitly placed by tile.row/tile.col (below) rather
  // than relying on array order + CSS auto-flow -- swapTiles/rotateTile
  // only ever update row/col/rotation on the tile objects, never their
  // position within the tiles array, so auto-flow placement never moved
  // a swapped tile on screen.
  const gridSize = Math.round(Math.sqrt(tiles.length)) || 3;

  // Render a simple grid of tiles. Keep markup minimal so this file is easy to drop in.
  // The visual styling is expected to be provided by the app's CSS/Tailwind.
  return (
    <div
      ref={boardRef}
      className="game-board w-full h-full flex items-center justify-center"
      style={{ transform: `scale(${zoomLevel})` }}
    >
      <div className="tiles-grid grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: 'min(900px, 95%)' }}>
        {tiles.map((tile) => {
          const isSelected = selectedTile === tile.id;
          const isMatched = matchingEdges.has(tile.id);

          return (
            <div
              key={tile.id}
              role="button"
              tabIndex={0}
              onMouseDown={(e) => handleDown(e, tile.id)}
              onMouseUp={(e) => handleUp(e, tile.id)}
              onTouchStart={(e) => handleDown(e, tile.id)}
              onTouchEnd={(e) => handleUp(e, tile.id)}
              onTouchMove={handleMove}
              onMouseMove={handleMove}
              className={`tile relative select-none bg-navy-dark border border-navy rounded-md overflow-hidden flex items-center justify-center cursor-pointer`}
              style={{
                gridColumn: tile.col + 1,
                gridRow: tile.row + 1,
                width: '100%',
                aspectRatio: '1 / 1',
                transform: `rotate(${tile.rotation ?? 0}deg)`,
                outline: isSelected ? '3px solid rgba(78,205,196,0.25)' : undefined,
                opacity: isMatched ? 0.9 : 1
              }}
              aria-pressed={isSelected}
            >
              {tile.imageData ? (
                <img src={tile.imageData} alt={`tile-${tile.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div className="text-xs text-offwhite font-mono">{tile.id}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls fallback for accessibility / quick actions */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button onClick={onUndo} disabled={!canUndo} className="px-3 py-1 rounded bg-offwhite text-navy text-xs">
          Undo
        </button>
        <button onClick={onShuffle} className="px-3 py-1 rounded bg-teal/20 text-teal text-xs">
          Shuffle
        </button>
        <button onClick={onPause} className="px-3 py-1 rounded bg-offwhite text-navy text-xs">
          Pause
        </button>
        <button onClick={onRestart} className="px-3 py-1 rounded bg-coral/20 text-coral text-xs">
          Restart
        </button>
        {onZoomIn && onZoomOut && (
          <>
            <button onClick={onZoomOut} className="px-2 py-1 rounded bg-navy-dark text-offwhite text-xs">-</button>
            <div className="px-2 py-1 rounded bg-navy text-offwhite text-xs">{Math.round(zoomLevel * 100)}%</div>
            <button onClick={onZoomIn} className="px-2 py-1 rounded bg-navy-dark text-offwhite text-xs">+</button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
