import { Tile } from '../models/types';
import { EdgeExtractionService } from './EdgeExtractionService';

export class PuzzleGenerationService {
  static createPuzzleFromGradient(gradient: string[], difficulty: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    const grad = ctx.createLinearGradient(0, 0, 300, 300);
    gradient.forEach((color, index) => {
      grad.addColorStop(index / (gradient.length - 1), color);
    });
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 300);
    
    // Add some visual elements based on difficulty
    ctx.fillStyle = '#ffffff20';
    if (difficulty === 'Easy') {
      ctx.fillRect(100, 100, 100, 100);
    } else if (difficulty === 'Medium') {
      ctx.fillRect(50, 50, 200, 200);
      ctx.beginPath();
      ctx.arc(150, 150, 60, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(i * 60, i * 60, 50, 50);
        ctx.beginPath();
        ctx.arc(150 + i * 20, 150 - i * 20, 30, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return canvas;
  }

  static createTilesFromCanvas(canvas: HTMLCanvasElement): Tile[] {
    const tileSize = canvas.width / 3;
    const tiles: Tile[] = [];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = tileSize;
        tileCanvas.height = tileSize;
        const tileCtx = tileCanvas.getContext('2d');
        
        if (!tileCtx) continue;
        
        tileCtx.drawImage(
          canvas, 
          col * tileSize, 
          row * tileSize, 
          tileSize, 
          tileSize, 
          0, 
          0, 
          tileSize, 
          tileSize
        );
        
        tiles.push({
          id: `${row}-${col}`,
          row,
          col,
          originalRow: row,
          originalCol: col,
          imageData: tileCanvas.toDataURL(),
          rotation: Math.floor(Math.random() * 4),
          tileSize,
          edgeHashes: EdgeExtractionService.extractEdgeHashes(
            tileCanvas
          )
        });
      }
    }
    
    return this.shuffleTiles(tiles);
  }

  private static shuffleTiles(tiles: Tile[]): Tile[] {
    const positions: { row: number; col: number }[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push({ row, col });
      }
    }
    
    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    return tiles.map((tile, index) => ({
      ...tile,
      row: positions[index].row,
      col: positions[index].col
    }));
  }
}
