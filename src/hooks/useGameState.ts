import {
  useState,
  useCallback,
  useEffect
} from 'react';

import {
  GameState,
  Puzzle
} from '../models/types';

import {
  PuzzleGenerationService
} from '../services/PuzzleGenerationService';

import {
  GameLogicService
} from '../services/GameLogicService';

export const useGameState = () => {
  const [zoomLevel, setZoomLevel] =
    useState(1);

  const [gameState, setGameState] =
    useState<GameState>({
      status: 'start',

      tiles: [],

      moves: 0,

      swaps: 0,

      undos: 0,

      startTime:
        Date.now(),

      currentTime:
        0,

      solveTime:
        null,

      selectedTile:
        null,

      moveHistory:
        [],

      matchingEdges:
        new Set(),

      isPaused:
        false,

      pausedTime:
        0
    });

  const updateMatches =
    useCallback(
      (
        tiles
      ) => {
        const matches =
          GameLogicService.checkEdgeMatches(
            tiles
          );

        const solved =
          GameLogicService.isSolved(
            tiles
          );

        setGameState(
          prev => ({
            ...prev,

            matchingEdges:
              matches,

            status:
              solved
                ? 'solved'
                : prev.status,

            solveTime:
              solved
                ? Date.now() -
                  prev.startTime -
                  prev.pausedTime
                : prev.solveTime
          })
        );
      },

      []
    );

  const loadPuzzleCanvas =
    useCallback(
      (
        canvas,
        difficulty =
          'Medium'
      ) => {
        const tiles =
          PuzzleGenerationService.createTilesFromCanvas(
            canvas,

            difficulty
          );

        setGameState(
          prev => ({
            ...prev,

            tiles,

            status:
              'playing',

            startTime:
              Date.now(),

            currentTime:
              0,

            solveTime:
              null,

            moves:
              0,

            swaps:
              0,

            undos:
              0,

            moveHistory:
              [],

            selectedTile:
              null
          })
        );

        updateMatches(
          tiles
        );
      },

      [
        updateMatches
      ]
    );

  useEffect(() => {
    if (
      gameState.status !==
        'playing' ||
      gameState.isPaused
    ) {
      return;
    }

    const timer =
      setInterval(
        () => {
          setGameState(
            prev => ({
              ...prev,

              currentTime:
                Date.now() -
                prev.startTime -
                prev.pausedTime
            })
          );
        },

        100
      );

    return () =>
      clearInterval(
        timer
      );
  }, [
    gameState.status,
    gameState.isPaused
  ]);

  const startGame =
    useCallback(
      (
        puzzle?: Puzzle
      ) => {
        resetZoom();

        setGameState(
          prev => ({
            ...prev,

            status:
              'loading'
          })
        );

        setTimeout(
          () => {
            try {
              if (
                puzzle?.imageUrl
              ) {
                const img =
                  new Image();

                img.crossOrigin =
                  'anonymous';

                img.onload =
                  () => {
                    const canvas =
                      document.createElement(
                        'canvas'
                      );

                    const size =
                      Math.min(
                        img.width,
                        img.height
                      );

                    canvas.width =
                      size;

                    canvas.height =
                      size;

                    const ctx =
                      canvas.getContext(
                        '2d'
                      );

                    if (
                      ctx
                    ) {
                      ctx.drawImage(
                        img,

                        0,

                        0,

                        size,

                        size
                      );

                      loadPuzzleCanvas(
                        canvas,

                        puzzle.difficulty
                      );
                    }
                  };

                img.src =
                  puzzle.imageUrl;

                return;
              }

              const canvas =
                PuzzleGenerationService.createPuzzleFromGradient(
                  puzzle
                    ?.gradient ??
                    [
                      '#ff6b6b',
                      '#4ecdc4',
                      '#45b7d1'
                    ],

                  puzzle
                    ?.difficulty ??
                    'Medium'
                );

              loadPuzzleCanvas(
                canvas,

                puzzle
                  ?.difficulty
              );
            } catch {
              setGameState(
                prev => ({
                  ...prev,

                  status:
                    'idle'
                })
              );
            }
          },

          300
        );
      },

      [
        loadPuzzleCanvas
      ]
    );

  const rotateTile =
    useCallback(
      (
        tileId,
        amount = 90
      ) => {
        if (
          gameState.status !==
            'playing' ||
          gameState.isPaused
        ) {
          return;
        }

        setGameState(
          prev => {
            const tile =
              prev.tiles.find(
                t =>
                  t.id ===
                  tileId
              );

            if (
              !tile
            ) {
              return prev;
            }

            const tiles =
              GameLogicService.rotateTile(
                prev.tiles,

                tileId,

                amount
              );

            updateMatches(
              tiles
            );

            return {
              ...prev,

              tiles,

              moves:
                prev.moves +
                1,

              moveHistory:
                [
                  ...prev.moveHistory,

                  {
                    type:
                      'rotate',

                    tileId,

                    previousRotation:
                      tile.rotation
                  }
                ]
            };
          }
        );
      },

      [
        gameState.status,
        gameState.isPaused,
        updateMatches
      ]
    );

  const swapTiles =
    useCallback(
      (
        tile1,
        tile2
      ) => {
        setGameState(
          prev => {
            const tiles =
              GameLogicService.swapTiles(
                prev.tiles,

                tile1,

                tile2
              );

            updateMatches(
              tiles
            );

            return {
              ...prev,

              tiles,

              swaps:
                prev.swaps +
                1,

              selectedTile:
                null
            };
          }
        );
      },

      [
        updateMatches
      ]
    );

  const selectTile =
    useCallback(
      id => {
        setGameState(
          prev => ({
            ...prev,

            selectedTile:
              id
          })
        );
      },

      []
    );

  const pauseGame =
    useCallback(
      () => {
        setGameState(
          prev => ({
            ...prev,

            isPaused:
              true
          })
        );
      },

      []
    );

  const resumeGame =
    useCallback(
      () => {
        setGameState(
          prev => ({
            ...prev,

            isPaused:
              false
          })
        );
      },

      []
    );

  const resetZoom =
    useCallback(
      () =>
        setZoomLevel(
          1
        ),

      []
    );

  const zoomIn =
    useCallback(
      () =>
        setZoomLevel(
          z =>
            Math.min(
              z +
                0.1,

              1.5
            )
        ),

      []
    );

  const zoomOut =
    useCallback(
      () =>
        setZoomLevel(
          z =>
            Math.max(
              z -
                0.1,

              0.7
            )
        ),

      []
    );

  const resetGame =
    useCallback(
      () => {
        resetZoom();

        setGameState({
          status:
            'idle',

          tiles:
            [],

          moves:
            0,

          swaps:
            0,

          undos:
            0,

          startTime:
            Date.now(),

          currentTime:
            0,

          solveTime:
            null,

          selectedTile:
            null,

          moveHistory:
            [],

          matchingEdges:
            new Set(),

          isPaused:
            false,

          pausedTime:
            0
        });
      },

      [
        resetZoom
      ]
    );

  const dismissStartScreen =
    useCallback(
      () =>
        setGameState(
          prev => ({
            ...prev,

            status:
              'idle'
          })
        ),

      []
    );

  return {
    gameState,

    zoomLevel,

    zoomIn,

    zoomOut,

    resetZoom,

    startGame,

    rotateTile,

    swapTiles,

    selectTile,

    pauseGame,

    resumeGame,

    resetGame,

    dismissStartScreen
  };
};
