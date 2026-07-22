// src/components/game/GameBoard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { GameLogicService } from '../../services/GameLogicService';
import { useTileDragGesture } from '../../hooks/useTileDragGesture';
import { Tooltip } from '../common/Tooltip';

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

  // The board must fit any device shape (phone/tablet/laptop, portrait or
  // landscape) without either overflowing the viewport or going tiny on a
  // wide-but-short window. Measured off boardRef via ResizeObserver's
  // contentRect (the box's true layout size).
  const [available, setAvailable] = useState({ width: 300, height: 300 });

  // Approx height of the zoom-control row plus the flex gap above it --
  // reserved so the row always has real room below the board instead of
  // sitting past the box's edge, where the bottom toolbar (painted after
  // it) would cover it.
  const hasZoomControls = Boolean(onZoomIn && onZoomOut);
  const zoomRowReservedPx = hasZoomControls ? 44 : 0;

  useEffect(() => {
    const el = boardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setAvailable({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // zoomLevel used to be applied as a CSS `transform: scale()` on top of
  // this fitted size -- transforms don't participate in layout, so at
  // 110%+ zoom the tiles-grid visually overflowed past its own box and
  // got covered by whatever sibling painted after it (the zoom row, then
  // the bottom toolbar). Folding zoomLevel directly into the real
  // rendered width/height instead makes overflow structurally impossible.
  //
  // Default (zoomLevel 1) is deliberately sized to fill ~96-99% of the
  // available box -- by request, prioritizing the board looking as big as
  // possible by default over zoom-in having headroom to grow further (zoom
  // in beyond 100% has nowhere left to go and is a near no-op; zooming out
  // below 100% still visibly shrinks it).
  const maxCap = Math.min(available.width, available.height - zoomRowReservedPx) * 0.98;
  const fitAtDefault = maxCap * 0.96;
  const squareSize = Math.max(120, Math.min(900, fitAtDefault * zoomLevel, maxCap));

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
      className="game-board w-full h-full flex flex-col items-center justify-center gap-3 min-h-0"
    >
      <div className="tiles-grid grid gap-1 relative" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: squareSize, height: squareSize }}>
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

      {/* Zoom only -- Undo/Shuffle/Pause/Restart already live in the
          persistent toolbar below the board (App.tsx); duplicating them
          here as a second, absolutely-positioned cluster was the "extra
          buttons floating on the right" bug. */}
      {onZoomIn && onZoomOut && (
        <div className="flex items-center gap-2">
          <Tooltip label="Zoom out" position="top">
            <button onClick={onZoomOut} aria-label="Zoom out" className="px-2 py-1 rounded bg-navy-dark text-offwhite text-xs">-</button>
          </Tooltip>
          <div className="px-2 py-1 rounded bg-navy text-offwhite text-xs">{Math.round(zoomLevel * 100)}%</div>
          <Tooltip label="Zoom in" position="top">
            <button onClick={onZoomIn} aria-label="Zoom in" className="px-2 py-1 rounded bg-navy-dark text-offwhite text-xs">+</button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
