import { useState, useCallback, useEffect } from 'react';

import {
  Tile,
  GameState as GameStateType
} from '../models/types';

import {
  PuzzleGenerationService
} from '../services/PuzzleGenerationService';

import {
  GameLogicService
} from '../services/GameLogicService';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameStateType>({
    tiles: [],
    status: 'start',
    moves: 0,
    swaps: 0,
    undos: 0,
    currentTime: 0,
    solveTime: null,
    selectedTile: null,
    moveHistory: [],
    matchingEdges: new Set(),
    startTime: Date.now(),
    isPaused: false,
    pausedTime: 0
  });

  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState.status === 'playing' && !gameState.isPaused) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          currentTime: Date.now() - prev.startTime - prev.pausedTime
        }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState.status, gameState.isPaused]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

    // Shuffle positions
    const positions: { row: number; col: number }[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push({ row, col });
      }
    }
    
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    const shuffledTiles = newTiles.map((tile, index) => ({
      ...tile,
      row: positions[index].row,
      col: positions[index].col
    }));
    
    setGameState(prev => ({
      ...prev,
      tiles: shuffledTiles,
      status: 'playing',
      startTime: Date.now()
    }));
  }, []);

  // Dismiss start screen - move to home/idle state
  const dismissStartScreen = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'idle'
    }));
  }, []);

  // Start game
  const startGame = useCallback((puzzle?: any) => {
    console.log('🎯 useGameState.startGame called with:', puzzle);
    
    // Reset zoom when starting a new game
    resetZoom();
    
    setGameState(prev => ({
      ...prev,
      status: 'loading',
      moves: 0,
      swaps: 0,
      undos: 0,
      currentTime: 0,
      solveTime: null,
      selectedTile: null,
      moveHistory: [],
      matchingEdges: new Set(),
      isPaused: false,
      pausedTime: 0
    }));

    setTimeout(() => {
      try {
        let canvas: HTMLCanvasElement;
        
        // Check if puzzle has an image URL
        if (puzzle?.imageUrl) {
          console.log('📷 Loading puzzle from URL:', puzzle.imageUrl);
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            console.log('✅ Image loaded successfully!');
            canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              const offsetX = (img.width - size) / 2;
              const offsetY = (img.height - size) / 2;
              ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
              createTilesFromCanvas(canvas);
            }
          };
          
          img.onerror = (error) => {
            console.error('❌ Failed to load image:', error);
            console.log('🔄 Falling back to gradient');
            canvas = PuzzleGenerationService.createPuzzleFromGradient(
              puzzle.gradient || ['#ff6b6b', '#4ecdc4', '#45b7d1'],
              puzzle.difficulty || 'Medium'
            );
            createTilesFromCanvas(canvas);
          };
          
          img.src = puzzle.imageUrl;
          return;
        }
        
        // Use puzzle gradient or default
        console.log('🎨 Using gradient fallback');
        if (puzzle?.gradient) {
          canvas = PuzzleGenerationService.createPuzzleFromGradient(
            puzzle.gradient,
            puzzle.difficulty || 'Medium'
          );
        } else {
          canvas = PuzzleGenerationService.createPuzzleFromGradient(
            ['#ff6b6b', '#4ecdc4', '#45b7d1'],
            'Medium'
          );
        }
        
        createTilesFromCanvas(canvas);
      } catch (error) {
        console.error('💥 Failed to start game:', error);
        const canvas = PuzzleGenerationService.createPuzzleFromGradient(
          ['#ff6b6b', '#4ecdc4', '#45b7d1'],
          'Medium'
        );
        createTilesFromCanvas(canvas);
      }
    }, 500);
  }, [createTilesFromCanvas, resetZoom]);
    
    setGameState(prev => {
      // Only update to solved if we were playing and puzzle is actually solved
      if (isSolved && prev.status === 'playing') {
        const finalTime = Date.now() - prev.startTime - prev.pausedTime;
        console.log('🏆 PUZZLE SOLVED! Setting status to solved');
        console.log('📊 Final stats - Time:', finalTime, 'Moves:', prev.moves, 'Swaps:', prev.swaps);
        return {
          ...prev,
          matchingEdges: matches,
          status: 'solved',
          solveTime: finalTime
        };
      }
      
      // Otherwise just update matching edges
      return {
        ...prev,
        matchingEdges: matches
      };
    });
  }, [gameState.tiles, checkIfSolved]);

  // Update edge matches when tiles change
  useEffect(() => {
    if (gameState.tiles.length > 0) {
      checkEdgeMatches();
    }
  }, [gameState.tiles, checkEdgeMatches]);

  // Rotate tile
  const rotateTile = useCallback((tileId: string, direction: number) => {
    if (gameState.status !== 'playing' || gameState.isPaused) return;
    
    setGameState(prev => {
      const tile = prev.tiles.find(t => t.id === tileId);
      if (!tile) return prev;
      
      return {
        ...prev,
        tiles: prev.tiles.map(t =>
          t.id === tileId
            ? { ...t, rotation: (t.rotation + direction + 4) % 4 }
            : t
        ),
        moves: prev.moves + 1,
        moveHistory: [
          ...prev.moveHistory,
          { type: 'rotate', tileId, previousRotation: tile.rotation }
        ]
      };
    });
  }, [gameState.status, gameState.isPaused]);

  // Swap tiles
  const swapTiles = useCallback((tile1Id: string, tile2Id: string) => {
    if (gameState.status !== 'playing' || gameState.isPaused) return;
    
    setGameState(prev => {
      const tile1 = prev.tiles.find(t => t.id === tile1Id);
      const tile2 = prev.tiles.find(t => t.id === tile2Id);
      if (!tile1 || !tile2) return prev;
      
      return {
        ...prev,
        tiles: prev.tiles.map(t => {
          if (t.id === tile1Id) return { ...t, row: tile2.row, col: tile2.col };
          if (t.id === tile2Id) return { ...t, row: tile1.row, col: tile1.col };
          return t;
        }),
        swaps: prev.swaps + 1,
        selectedTile: null,
        moveHistory: [
          ...prev.moveHistory,
          {
            type: 'swap',
            tile1Id,
            tile2Id,
            tile1PrevPos: { row: tile1.row, col: tile1.col },
            tile2PrevPos: { row: tile2.row, col: tile2.col }
          }
        ]
      };
    });
  }, [gameState.status, gameState.isPaused]);

  // Select tile
  const selectTile = useCallback((tileId: string | null) => {
    setGameState(prev => ({ ...prev, selectedTile: tileId }));
  }, []);

    setGameState(prev => ({
      ...prev,
      tiles: prev.tiles.map((tile, index) => ({
        ...tile,
        row: positions[index].row,
        col: positions[index].col,
        rotation: Math.floor(Math.random() * 4)
      })),
      moveHistory: [],
      selectedTile: null
    }));
[gameState.status]);

  // Pause game
  const pauseGame = useCallback(() => {
    if (gameState.status !== 'playing') return;
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, [gameState.status]);

  // Resume game
  const resumeGame = useCallback(() => {
    if (!gameState.isPaused) return;
    const pauseDuration = Date.now() - (gameState.startTime + gameState.currentTime + gameState.pausedTime);
    setGameState(prev => ({
      ...prev,
      isPaused: false,
      pausedTime: prev.pausedTime + pauseDuration
    }));
  }, [gameState.isPaused, gameState.startTime, gameState.currentTime, gameState.pausedTime]);

  // Reset game - go back to idle/home state
  const resetGame = useCallback(() => {
    resetZoom();
    setGameState({
      tiles: [],
      status: 'idle',
      moves: 0,
      swaps: 0,
      undos: 0,
      currentTime: 0,
      solveTime: null,
      selectedTile: null,
      moveHistory: [],
      matchingEdges: new Set(),
      startTime: Date.now(),
      isPaused: false,
      pausedTime: 0
    });
  }, [resetZoom]);

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
