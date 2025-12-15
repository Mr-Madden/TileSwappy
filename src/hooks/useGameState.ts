import { useState, useCallback, useEffect } from 'react';
import { Tile, GameState as GameStateType } from '../models/types';
import { PuzzleGenerationService } from '../services/PuzzleGenerationService';

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

  // Create tiles from canvas - INTERNAL HELPER FUNCTION
  const createTilesFromCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const tileSize = canvas.width / 3;
    const newTiles: Tile[] = [];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = tileSize;
        tileCanvas.height = tileSize;
        const tileCtx = tileCanvas.getContext('2d');
        
        if (tileCtx) {
          tileCtx.drawImage(canvas, col * tileSize, row * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);
          
          newTiles.push({
            id: `${row}-${col}`,
            row,
            col,
            originalRow: row,
            originalCol: col,
            imageData: tileCanvas.toDataURL(),
            rotation: Math.floor(Math.random() * 4),
            tileSize,
            edgeHashes: {
              top: `${row}-${col}-top`,
              right: `${row}-${col}-right`,
              bottom: `${row}-${col}-bottom`,
              left: `${row}-${col}-left`
            }
          });
        }
      }
    }
    
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

  // Helper functions for edge matching
  const getRotatedEdge = (tile: Tile, direction: 'top' | 'right' | 'bottom' | 'left'): string => {
    const directions = ['top', 'right', 'bottom', 'left'];
    const currentIndex = directions.indexOf(direction);
    const originalIndex = (currentIndex - tile.rotation + 4) % 4;
    return tile.edgeHashes[directions[originalIndex] as keyof typeof tile.edgeHashes];
  };

  const shouldEdgesMatch = (edge1: string, edge2: string): boolean => {
    const [row1, col1, side1] = edge1.split('-');
    const [row2, col2, side2] = edge2.split('-');
    
    if (row1 === row2 && Math.abs(parseInt(col1) - parseInt(col2)) === 1) {
      if ((col1 < col2 && side1 === 'right' && side2 === 'left') ||
          (col1 > col2 && side1 === 'left' && side2 === 'right')) {
        return true;
      }
    }
    if (col1 === col2 && Math.abs(parseInt(row1) - parseInt(row2)) === 1) {
      if ((row1 < row2 && side1 === 'bottom' && side2 === 'top') ||
          (row1 > row2 && side1 === 'top' && side2 === 'bottom')) {
        return true;
      }
    }
    return false;
  };

  // Helper function to check solution with a specific global rotation
  const checkSolutionWithGlobalRotation = useCallback((globalRotation: number): boolean => {
    // Create virtually rotated tiles
    const rotatedTiles = gameState.tiles.map(tile => ({
      ...tile,
      rotation: (tile.rotation + globalRotation) % 4
    }));
    
    // Check if all edges match with this global rotation
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const currentTile = rotatedTiles.find(t => t.row === row && t.col === col);
        if (!currentTile) return false;
        
        // Check right edge
        if (col < 2) {
          const rightTile = rotatedTiles.find(t => t.row === row && t.col === col + 1);
          if (!rightTile) return false;
          
          const currentRightEdge = getRotatedEdge(currentTile, 'right');
          const rightLeftEdge = getRotatedEdge(rightTile, 'left');
          if (!shouldEdgesMatch(currentRightEdge, rightLeftEdge)) {
            return false;
          }
        }
        
        // Check bottom edge
        if (row < 2) {
          const bottomTile = rotatedTiles.find(t => t.row === row + 1 && t.col === col);
          if (!bottomTile) return false;
          
          const currentBottomEdge = getRotatedEdge(currentTile, 'bottom');
          const bottomTopEdge = getRotatedEdge(bottomTile, 'top');
          if (!shouldEdgesMatch(currentBottomEdge, bottomTopEdge)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }, [gameState.tiles]);

  // Check if puzzle is solved
  const checkIfSolved = useCallback(() => {
    if (gameState.tiles.length !== 9) return false;
    
    // Check all 4 possible global rotations
    for (let globalRotation = 0; globalRotation < 4; globalRotation++) {
      if (checkSolutionWithGlobalRotation(globalRotation)) {
        return true;
      }
    }
    
    return false;
  }, [gameState.tiles, checkSolutionWithGlobalRotation]);

  // Check edge matches - FIXED VERSION
  const checkEdgeMatches = useCallback(() => {
    const matches = new Set<string>();
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const currentTile = gameState.tiles.find(t => t.row === row && t.col === col);
        if (!currentTile) continue;
        
        // Check right edge
        if (col < 2) {
          const rightTile = gameState.tiles.find(t => t.row === row && t.col === col + 1);
          if (rightTile) {
            const currentRightEdge = getRotatedEdge(currentTile, 'right');
            const rightLeftEdge = getRotatedEdge(rightTile, 'left');
            if (shouldEdgesMatch(currentRightEdge, rightLeftEdge)) {
              matches.add(`${row}-${col}-right`);
            }
          }
        }
        
        // Check bottom edge
        if (row < 2) {
          const bottomTile = gameState.tiles.find(t => t.row === row + 1 && t.col === col);
          if (bottomTile) {
            const currentBottomEdge = getRotatedEdge(currentTile, 'bottom');
            const bottomTopEdge = getRotatedEdge(bottomTile, 'top');
            if (shouldEdgesMatch(currentBottomEdge, bottomTopEdge)) {
              matches.add(`${row}-${col}-bottom`);
            }
          }
        }
      }
    }
    
    // Check if solved - Use setGameState with prev to get fresh state
    const isSolved = checkIfSolved();
    
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

  // Undo last move
  const undoLastMove = useCallback(() => {
    if (gameState.moveHistory.length === 0 || gameState.status !== 'playing') return;
    
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    
    setGameState(prev => {
      if (lastMove.type === 'rotate') {
        return {
          ...prev,
          tiles: prev.tiles.map(t =>
            t.id === lastMove.tileId ? { ...t, rotation: lastMove.previousRotation || 0 } : t
          ),
          moves: Math.max(0, prev.moves - 1),
          undos: prev.undos + 1,
          moveHistory: prev.moveHistory.slice(0, -1)
        };
      } else if (lastMove.type === 'swap' && lastMove.tile1PrevPos && lastMove.tile2PrevPos) {
        return {
          ...prev,
          tiles: prev.tiles.map(t => {
            if (t.id === lastMove.tile1Id) {
              return { ...t, row: lastMove.tile1PrevPos!.row, col: lastMove.tile1PrevPos!.col };
            }
            if (t.id === lastMove.tile2Id) {
              return { ...t, row: lastMove.tile2PrevPos!.row, col: lastMove.tile2PrevPos!.col };
            }
            return t;
          }),
          swaps: Math.max(0, prev.swaps - 1),
          undos: prev.undos + 1,
          moveHistory: prev.moveHistory.slice(0, -1)
        };
      }
      return prev;
    });
  }, [gameState.moveHistory, gameState.status]);

  // Shuffle all tiles
  const shuffleAll = useCallback(() => {
    if (gameState.status !== 'playing') return;
    
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
  }, [gameState.status]);

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
    undoLastMove,
    shuffleAll,
    pauseGame,
    resumeGame,
    resetGame,
    dismissStartScreen
  };
};