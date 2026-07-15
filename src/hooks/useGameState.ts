import {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';

import {
  GameState,
  Puzzle,
  Tile,
  Difficulty
} from '../models/types';

import {
  PuzzleGenerationService
} from '../services/PuzzleGenerationService';

import {
  GameLogicService
} from '../services/GameLogicService';

export const useGameState = () => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const [gameState, setGameState] =
    useState<GameState>({
      status: 'start',
      tiles: [],
      moves: 0,
      swaps: 0,
      undos: 0,
      startTime: Date.now(),
      currentTime: 0,
      solveTime: null,
      selectedTile: null,
      moveHistory: [],
      matchingEdges: new Set(),
      isPaused: false,
      pausedTime: 0
    });

  const pauseStartRef = useRef<number | null>(null);

  const updateMatches = useCallback(
    (tiles: Tile[]) => {
      const matches =
        GameLogicService.checkEdgeMatches(tiles);

      const solved =
        GameLogicService.isSolved(tiles);

      setGameState(prev => ({
        ...prev,
        matchingEdges: matches,
        status: solved ? 'solved' : prev.status,
        solveTime: solved
          ? Date.now() - prev.startTime - prev.pausedTime
          : prev.solveTime
      }));
    },
    []
  );

  const loadPuzzleCanvas = useCallback(
    (canvas: HTMLCanvasElement, difficulty: Difficulty = 'Medium') => {
      const tiles =
        PuzzleGenerationService.createTilesFromCanvas(
          canvas,
          difficulty
        );

      setGameState(prev => ({
        ...prev,
        tiles,
        status: 'playing',
        startTime: Date.now(),
        currentTime: 0,
        solveTime: null,
        moves: 0,
        swaps: 0,
        undos: 0,
        moveHistory: [],
        selectedTile: null,
        matchingEdges: new Set(),
        isPaused: false,
        pausedTime: 0
      }));

      updateMatches(tiles);
    },
    [updateMatches]
  );

  useEffect(() => {
    if (
      gameState.status !== 'playing' ||
      gameState.isPaused
    ) {
      return;
    }

    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        currentTime:
          Date.now() - prev.startTime - prev.pausedTime
      }));
    }, 100);

    return () => clearInterval(timer);
  }, [gameState.status, gameState.isPaused]);

  const resetZoom = useCallback(
    () => setZoomLevel(1),
    []
  );

  const startGame = useCallback(
    (puzzle?: Puzzle) => {
      resetZoom();

      setGameState(prev => ({
        ...prev,
        status: 'loading'
      }));

      setTimeout(() => {
        try {
          if (puzzle?.imageUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
              const canvas =
                document.createElement('canvas');

              const size =
                Math.min(img.width, img.height);

              canvas.width = size;
              canvas.height = size;

              const ctx =
                canvas.getContext('2d');

              if (ctx) {
                ctx.drawImage(
                  img,
                  0,
                  0,
                  size,
                  size,
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

            img.src = puzzle.imageUrl;
            return;
          }

          const canvas =
            PuzzleGenerationService.createPuzzleFromGradient(
              puzzle?.gradient ?? [
                '#ff6b6b',
                '#4ecdc4',
                '#45b7d1'
              ],
              puzzle?.difficulty ?? 'Medium'
            );

          loadPuzzleCanvas(
            canvas,
            puzzle?.difficulty
          );
        } catch {
          setGameState(prev => ({
            ...prev,
            status: 'idle'
          }));
        }
      }, 300);
    },
    [loadPuzzleCanvas, resetZoom]
  );

  const rotateTile = useCallback(
    (tileId: string, amount: 0 | 90 | 180 | 270 = 90) => {
      if (
        gameState.status !== 'playing' ||
        gameState.isPaused
      ) {
        return;
      }

      setGameState(prev => {
        const tile =
          prev.tiles.find(t => t.id === tileId);

        if (!tile) {
          return prev;
        }

        const tiles =
          GameLogicService.rotateTile(
            prev.tiles,
            tileId,
            amount
          );

        updateMatches(tiles);

        return {
          ...prev,
          tiles,
          moves: prev.moves + 1,
          moveHistory: [
            ...prev.moveHistory,
            {
              type: 'rotate',
              tileId,
              previousRotation: tile.rotation
            }
          ]
        };
      });
    },
    [gameState.status, gameState.isPaused, updateMatches]
  );

  const swapTiles = useCallback(
    (tile1: string, tile2: string) => {
      setGameState(prev => {
        const first =
          prev.tiles.find(t => t.id === tile1);
        const second =
          prev.tiles.find(t => t.id === tile2);

        if (!first || !second) {
          return prev;
        }

        const tiles =
          GameLogicService.swapTiles(
            prev.tiles,
            tile1,
            tile2
          );

        updateMatches(tiles);

        return {
          ...prev,
          tiles,
          swaps: prev.swaps + 1,
          selectedTile: null,
          moveHistory: [
            ...prev.moveHistory,
            {
              type: 'swap',
              tile1Id: tile1,
              tile2Id: tile2,
              tile1PrevPos: {
                row: first.row,
                col: first.col
              },
              tile2PrevPos: {
                row: second.row,
                col: second.col
              }
            }
          ]
        };
      });
    },
    [updateMatches]
  );

  const selectTile = useCallback(
    (id: string | null) => {
      setGameState(prev => ({
        ...prev,
        selectedTile: id
      }));
    },
    []
  );

  const pauseGame = useCallback(
    () => {
      setGameState(prev => {
        if (
          prev.isPaused ||
          prev.status !== 'playing'
        ) {
          return prev;
        }

        pauseStartRef.current = Date.now();

        return {
          ...prev,
          isPaused: true
        };
      });
    },
    []
  );

  const resumeGame = useCallback(
    () => {
      setGameState(prev => {
        if (!prev.isPaused) {
          return prev;
        }

        const now = Date.now();
        const extra =
          pauseStartRef.current
            ? now - pauseStartRef.current
            : 0;

        pauseStartRef.current = null;

        return {
          ...prev,
          isPaused: false,
          pausedTime: prev.pausedTime + extra
        };
      });
    },
    []
  );

  const zoomIn = useCallback(
    () =>
      setZoomLevel(z =>
        Math.min(z + 0.1, 1.5)
      ),
    []
  );

  const zoomOut = useCallback(
    () =>
      setZoomLevel(z =>
        Math.max(z - 0.1, 0.7)
      ),
    []
  );

  const resetGame = useCallback(
    () => {
      resetZoom();

      setGameState({
        status: 'idle',
        tiles: [],
        moves: 0,
        swaps: 0,
        undos: 0,
        startTime: Date.now(),
        currentTime: 0,
        solveTime: null,
        selectedTile: null,
        moveHistory: [],
        matchingEdges: new Set(),
        isPaused: false,
        pausedTime: 0
      });
    },
    [resetZoom]
  );

  const dismissStartScreen = useCallback(
    () =>
      setGameState(prev => ({
        ...prev,
        status: 'idle'
      })),
    []
  );

  const undoLastMove = useCallback(
    () => {
      setGameState(prev => {
        if (prev.moveHistory.length === 0) {
          return prev;
        }

        const last =
          prev.moveHistory[prev.moveHistory.length - 1];

        const tiles =
          GameLogicService.undoMove(
            prev.tiles,
            last
          );

        updateMatches(tiles);

        return {
          ...prev,
          tiles,
          undos: prev.undos + 1,
          moveHistory:
            prev.moveHistory.slice(
              0,
              prev.moveHistory.length - 1
            )
        };
      });
    },
    [updateMatches]
  );

  const shuffleAll = useCallback(
    () => {
      setGameState(prev => {
        if (prev.tiles.length === 0) {
          return prev;
        }

        const positions: { row: number; col: number }[] =
          prev.tiles.map(t => ({
            row: t.row,
            col: t.col
          }));

        const shuffled = [...positions];

        for (let i = shuffled.length - 1; i > 0; i--) {
          const j =
            Math.floor(
              Math.random() * (i + 1)
            );

          [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
        }

        const tiles =
          prev.tiles.map((tile, index) => ({
            ...tile,
            row: shuffled[index].row,
            col: shuffled[index].col
          }));

        updateMatches(tiles);

        return {
          ...prev,
          tiles,
          selectedTile: null
        };
      });
    },
    [updateMatches]
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
    dismissStartScreen,
    undoLastMove,
    shuffleAll
  };
};
