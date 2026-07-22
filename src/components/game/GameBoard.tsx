// src/components/game/GameBoard.tsx
import React, { useRef } from 'react';
import { GameLogicService } from '../../services/GameLogicService';
import { useTileDragGesture } from '../../hooks/useTileDragGesture';

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
  onSelectTile: (tileId: string) => void;
  onRotateTile: (tileId: string, direction: 1 | -1) => void;
  onSwapTiles: (tileId1: string, tileId2: string) => void;
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

export const GameBoard: React.FC<GameBoardProps> = ({
  tiles,
  selectedTile,
  matchingEdges,
  onSelectTile,
  onRotateTile,
  onSwapTiles,
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
  const boardRef = useRef<HTMLDivElement | null>(null);

  const { dragState, hoverTargetId, getTileHandlers, tileAttr } = useTileDragGesture({
    onTap: onSelectTile,
    onRotate: onRotateTile,
    onDrop: (draggedTileId, targetTileId) => {
      if (targetTileId) {
        onSwapTiles(draggedTileId, targetTileId);
      }
    }
  });

  // Tiles must be explicitly placed by tile.row/tile.col (below) rather
  // than relying on array order + CSS auto-flow -- swapTiles/rotateTile
  // only ever update row/col/rotation on the tile objects, never their
  // position within the tiles array, so auto-flow placement never moved
  // a swapped tile on screen.
  const gridSize = Math.round(Math.sqrt(tiles.length)) || 3;

  // Glow bars for seams whose edges genuinely match -- rendered as a
  // single overlay layer at the whole-grid level, NOT as children of
  // each tile's own (rotating) div. A per-tile-child bar would inherit
  // that tile's `transform: rotate(...)`, double-applying a rotation
  // isEdgeMatch/getRotatedEdge already compensated for internally, and
  // would get clipped into two mismatched halves by each tile's own
  // `overflow-hidden` across the grid's gap. A grid-level overlay avoids
  // both problems. Matches the visual already promised in the tutorial
  // (TutorialScreen.tsx's mocked-up green glowing seam bars).
  const seamGlowStyle = {
    boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'
  };
  const seamBars: React.ReactNode[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (col < gridSize - 1 && matchingEdges.has(GameLogicService.seamKey(row, col, 'right'))) {
        seamBars.push(
          <div
            key={`v-${row}-${col}`}
            className="absolute w-1 bg-match animate-pulse"
            style={{
              left: `${((col + 1) / gridSize) * 100}%`,
              top: `${(row / gridSize) * 100}%`,
              height: `${(1 / gridSize) * 100}%`,
              transform: 'translateX(-50%)',
              ...seamGlowStyle
            }}
          />
        );
      }
      if (row < gridSize - 1 && matchingEdges.has(GameLogicService.seamKey(row, col, 'bottom'))) {
        seamBars.push(
          <div
            key={`h-${row}-${col}`}
            className="absolute h-1 bg-match animate-pulse"
            style={{
              top: `${((row + 1) / gridSize) * 100}%`,
              left: `${(col / gridSize) * 100}%`,
              width: `${(1 / gridSize) * 100}%`,
              transform: 'translateY(-50%)',
              ...seamGlowStyle
            }}
          />
        );
      }
    }
  }

  // The tile currently being dragged, rendered as a separate floating
  // overlay (same reasoning as the seam bars above: a per-tile-child
  // "lifted" copy would inherit the tile's own rotation transform and
  // get clipped by its neighbor's overflow-hidden). Positioned with the
  // same fractional-percentage math the seam bars use, then offset by
  // the live pointer delta.
  const draggedTile = dragState ? tiles.find(t => t.id === dragState.tileId) : null;

  return (
    <div
      ref={boardRef}
      className="game-board w-full h-full flex items-center justify-center"
      style={{ transform: `scale(${zoomLevel})` }}
    >
      <div className="tiles-grid grid gap-1 relative" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: 'min(900px, 95%)' }}>
        {tiles.map((tile) => {
          const isSelected = selectedTile === tile.id;
          const isBeingDragged = dragState?.tileId === tile.id;
          const isHoverTarget = hoverTargetId === tile.id;

          return (
            <div
              key={tile.id}
              role="button"
              tabIndex={0}
              {...{ [tileAttr]: tile.id }}
              {...getTileHandlers(tile.id)}
              className={`tile relative select-none touch-none bg-navy-dark border rounded-md overflow-hidden flex items-center justify-center cursor-pointer transition-opacity ${
                isHoverTarget ? 'border-teal ring-2 ring-teal' : 'border-navy'
              } ${isBeingDragged ? 'opacity-30' : ''}`}
              style={{
                gridColumn: tile.col + 1,
                gridRow: tile.row + 1,
                width: '100%',
                aspectRatio: '1 / 1',
                transform: `rotate(${tile.rotation ?? 0}deg)`,
                outline: isSelected ? '3px solid rgba(78,205,196,0.25)' : undefined
              }}
              aria-pressed={isSelected}
            >
              {tile.imageData ? (
                <img src={tile.imageData} alt={`tile-${tile.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
              ) : (
                <div className="text-xs text-offwhite font-mono">{tile.id}</div>
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 pointer-events-none z-20">{seamBars}</div>

        {draggedTile && dragState && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: `${(draggedTile.col / gridSize) * 100}%`,
              top: `${(draggedTile.row / gridSize) * 100}%`,
              width: `${(1 / gridSize) * 100}%`,
              height: `${(1 / gridSize) * 100}%`,
              padding: '2px',
              transform: `translate(${dragState.dx}px, ${dragState.dy}px)`
            }}
          >
            <div
              className="w-full h-full rounded-md overflow-hidden shadow-2xl ring-2 ring-teal"
              style={{
                transform: `rotate(${draggedTile.rotation ?? 0}deg) scale(1.08)`,
                boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
              }}
            >
              {draggedTile.imageData ? (
                <img src={draggedTile.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
              ) : (
                <div className="w-full h-full bg-navy-dark flex items-center justify-center text-xs text-offwhite font-mono">
                  {draggedTile.id}
                </div>
              )}
            </div>
          </div>
        )}
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
