import { useCallback, useRef, useState } from 'react';

// Shared gesture recognition for tile boards (the real GameBoard and the
// Tutorial's own mini board both need the exact same classification --
// duplicating this logic in two places is exactly the kind of drift
// that caused the seam-key producer/consumer bug this codebase already
// hit once, so it lives here as the single source of truth instead.
//
// Three gestures share the same pointer-down/up cycle, disambiguated
// without ever adding latency to the two that already exist:
//  - Tap (near-zero movement): select/swap, resolved instantly on release.
//  - Flick (mostly-horizontal, > ROTATE_MIN_DISTANCE, released before
//    DRAG_ACTIVATION_MS elapses): rotates, exactly as fast as before --
//    a deliberate flick-and-release always completes well under the
//    activation window, so this path is completely unchanged.
//  - Drag (pointer still down past DRAG_ACTIVATION_MS): the tile visibly
//    lifts and follows the pointer from that moment on; releasing over
//    a different tile swaps them, releasing anywhere else cancels.
// The activation window only ever delays the *new* gesture (drag),
// never the existing tap/flick paths, since those are only evaluated
// once the pointer is released -- and a release that happens before
// the window elapses is classified exactly as it always was.
const TAP_MAX_DISTANCE = 15;
const ROTATE_MIN_DISTANCE = 50;
const DRAG_ACTIVATION_MS = 160;

export interface TileDragState {
  tileId: string;
  dx: number;
  dy: number;
}

interface UseTileDragGestureOptions {
  onTap: (tileId: string) => void;
  onRotate: (tileId: string, direction: 1 | -1) => void;
  onDrop: (draggedTileId: string, targetTileId: string | null) => void;
  // Attribute used to identify a tile element under the pointer at
  // drop time via document.elementFromPoint -- each tile's DOM node
  // must carry this attribute set to its own tile id.
  tileAttr?: string;
}

interface StartInfo {
  x: number;
  y: number;
  time: number;
  tileId: string;
}

export function useTileDragGesture({
  onTap,
  onRotate,
  onDrop,
  tileAttr = 'data-tile-id'
}: UseTileDragGestureOptions) {
  const [dragState, setDragState] = useState<TileDragState | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const startRef = useRef<StartInfo | null>(null);
  const activatedRef = useRef(false);

  const reset = useCallback(() => {
    startRef.current = null;
    activatedRef.current = false;
    setDragState(null);
    setHoverTargetId(null);
  }, []);

  const findTileIdAtPoint = useCallback(
    (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const tileEl = el?.closest(`[${tileAttr}]`) as HTMLElement | null;
      return tileEl?.getAttribute(tileAttr) ?? null;
    },
    [tileAttr]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, tileId: string) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = { x: e.clientX, y: e.clientY, time: Date.now(), tileId };
      activatedRef.current = false;
      setDragState(null);
      setHoverTargetId(null);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const elapsed = Date.now() - start.time;

      if (!activatedRef.current && elapsed >= DRAG_ACTIVATION_MS) {
        activatedRef.current = true;
      }

      if (activatedRef.current) {
        setDragState({ tileId: start.tileId, dx, dy });
        const target = findTileIdAtPoint(e.clientX, e.clientY);
        setHoverTargetId(target && target !== start.tileId ? target : null);
      }
    },
    [findTileIdAtPoint]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start) {
        reset();
        return;
      }

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      if (activatedRef.current) {
        const targetId = findTileIdAtPoint(e.clientX, e.clientY);
        onDrop(start.tileId, targetId && targetId !== start.tileId ? targetId : null);
      } else if (Math.abs(dx) > ROTATE_MIN_DISTANCE && Math.abs(dx) > Math.abs(dy) * 2) {
        onRotate(start.tileId, dx > 0 ? -1 : 1);
      } else if (Math.abs(dx) < TAP_MAX_DISTANCE && Math.abs(dy) < TAP_MAX_DISTANCE) {
        onTap(start.tileId);
      }

      reset();
    },
    [findTileIdAtPoint, onDrop, onRotate, onTap, reset]
  );

  // A cancelled gesture (e.g. the OS takes over for a system gesture)
  // never resolves to an action -- just clears state.
  const handlePointerCancel = useCallback(() => {
    reset();
  }, [reset]);

  const getTileHandlers = useCallback(
    (tileId: string) => ({
      onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, tileId),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel
    }),
    [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel]
  );

  return {
    dragState,
    hoverTargetId,
    getTileHandlers,
    tileAttr
  };
}
