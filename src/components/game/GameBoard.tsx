import React from 'react';
import { Tile } from '../../models/types';

interface GameBoardProps {
  tiles: Tile[];

  selectedTile: string | null;

  matchingEdges: Set<string>;

  onTileInteraction: (
    tileId: string,
    deltaX: number,
    deltaY: number
  ) => void;

  onUndo: () => void;

  onShuffle: () => void;

  onPause: () => void;

  onRestart: () => void;

  canUndo: boolean;

  isPaused: boolean;

  zoomLevel: number;

  onZoomIn: () => void;

  onZoomOut: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tiles,

  selectedTile,

  matchingEdges,

  onTileInteraction,

  zoomLevel
}) => {
  const [
    swipeStart,
    setSwipeStart
  ] = React.useState({
    x: 0,
    y: 0,
    tileId: ''
  });

  const [
    panOffset,
    setPanOffset
  ] = React.useState({
    x: 0,
    y: 0
  });

  const [
    isPanning,
    setIsPanning
  ] = React.useState(
    false
  );

  const [
    panStart,
    setPanStart
  ] = React.useState({
    x: 0,
    y: 0
  });

  React.useEffect(
    () => {
      if (
        zoomLevel ===
        1
      ) {
        setPanOffset({
          x: 0,
          y: 0
        });
      }
    },

    [
      zoomLevel
    ]
  );

  const getPoint =
    (
      e:
        | React.MouseEvent
        | React.TouchEvent
    ) => {
      if (
        'touches' in
        e
      ) {
        return {
          x:
            e
              .touches[0]
              .clientX,

          y:
            e
              .touches[0]
              .clientY
        };
      }

      return {
        x:
          e.clientX,

        y:
          e.clientY
      };
    };

  const handleDown =
    (
      e,
      tileId
    ) => {
      e.preventDefault();

      const p =
        getPoint(
          e
        );

      setSwipeStart({
        ...p,

        tileId
      });
    };

  const handleUp =
    (
      e,
      tileId
    ) => {
      e.preventDefault();

      const p =
        'changedTouches'
          in e
          ? {
              x:
                e
                  .changedTouches[0]
                  .clientX,

              y:
                e
                  .changedTouches[0]
                  .clientY
            }
          : {
              x:
                e.clientX,

              y:
                e.clientY
            };

      if (
        swipeStart.tileId ===
        tileId
      ) {
        onTileInteraction(
          tileId,

          p.x -
            swipeStart.x,

          p.y -
            swipeStart.y
        );
      }

      setSwipeStart({
        x: 0,
        y: 0,
        tileId: ''
      });
    };

  const beginPan =
    e => {
      if (
        zoomLevel <=
        1
      ) {
        return;
      }

      const p =
        getPoint(
          e
        );

      setIsPanning(
        true
      );

      setPanStart({
        x:
          p.x -
          panOffset.x,

        y:
          p.y -
          panOffset.y
      });
    };

  const movePan =
    e => {
      if (
        !isPanning
      ) {
        return;
      }

      e.preventDefault();

      const p =
        getPoint(
          e
        );

      setPanOffset({
        x:
          p.x -
          panStart.x,

        y:
          p.y -
          panStart.y
      });
    };

  return (
    <div
      className="flex justify-center overflow-hidden"
      onMouseDown={
        beginPan
      }
      onMouseMove={
        movePan
      }
      onMouseUp={() =>
        setIsPanning(
          false
        )
      }
      onTouchStart={
        beginPan
      }
      onTouchMove={
        movePan
      }
      onTouchEnd={() =>
        setIsPanning(
          false
        )
      }
    >
      <div
        className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-navy-light"

        style={{
          width:
            'min(90vw,65vh)',

          height:
            'min(90vw,65vh)',

          transform:
            `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px,${panOffset.y / zoomLevel}px)`,

          transition:
            'transform .25s'
        }}
      >
        {[
          ...tiles
        ]
          .sort(
            (
              a,
              b
            ) =>
              a.row -
                b.row ||
              a.col -
                b.col
          )

          .map(
            tile => (
              <div
                key={
                  tile.id
                }

                className="relative"
              >
                <button
                  onMouseDown={e =>
                    handleDown(
                      e,

                      tile.id
                    )
                  }

                  onMouseUp={e =>
                    handleUp(
                      e,

                      tile.id
                    )
                  }

                  onTouchStart={e =>
                    handleDown(
                      e,

                      tile.id
                    )
                  }

                  onTouchEnd={e =>
                    handleUp(
                      e,

                      tile.id
                    )
                  }

                  className={`w-full h-full rounded-lg overflow-hidden border transition-all ${
                    selectedTile ===
                    tile.id
                      ? 'border-coral border-4 scale-95'
                      : 'border-navy-dark hover:border-teal'
                  }`}
                >
                  <img
                    src={
                      tile.imageData
                    }

                    draggable={
                      false
                    }

                    alt="tile"

                    className="w-full h-full"

                    style={{
                      transform:
                        `rotate(${tile.rotation}deg)`,

                      transition:
                        'transform .35s'
                    }}
                  />
                </button>

                {matchingEdges.has(
                  `${tile.id}-right`
                ) && (
                  <div
                    className="absolute right-0 top-0 w-[4px] h-full bg-green-400 animate-pulse"
                  />
                )}

                {matchingEdges.has(
                  `${tile.id}-bottom`
                ) && (
                  <div
                    className="absolute bottom-0 left-0 w-full h-[4px] bg-green-400 animate-pulse"
                  />
                )}
              </div>
            )
          )}
      </div>
    </div>
  );
};
