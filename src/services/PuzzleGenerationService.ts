import { Tile, Difficulty } from '../models/types';
import { EdgeExtractionService } from './EdgeExtractionService';

export class PuzzleGenerationService {
  private static readonly GRID = 3;
  private static readonly MAX_ATTEMPTS = 25;

  // Linear-gradient direction, in canvas start/end points -- mirrors CSS
  // linear-gradient()'s named directions (a corner direction runs the
  // gradient axis corner-to-corner, e.g. "to bottom right" is (0,0)->(size,size)).
  private static linearEndpoints(
    direction: string | undefined,
    size: number
  ): { x0: number; y0: number; x1: number; y1: number } {
    switch (direction) {
      case 'to top': return { x0: 0, y0: size, x1: 0, y1: 0 };
      case 'to bottom': return { x0: 0, y0: 0, x1: 0, y1: size };
      case 'to left': return { x0: size, y0: 0, x1: 0, y1: 0 };
      case 'to right': return { x0: 0, y0: 0, x1: size, y1: 0 };
      case 'to top left': return { x0: size, y0: size, x1: 0, y1: 0 };
      case 'to top right': return { x0: 0, y0: size, x1: size, y1: 0 };
      case 'to bottom left': return { x0: size, y0: 0, x1: 0, y1: size };
      case 'to bottom right': return { x0: 0, y0: 0, x1: size, y1: size };
      // No declared direction (or "wavy", which -- same as its CSS
      // browse-preview -- is just a plain top-to-bottom blend, not an
      // actual wave shape): the historical default, a top-left diagonal.
      default: return { x0: 0, y0: 0, x1: size, y1: size };
    }
  }

  /**
   * Renders the exact same pattern ArchiveModal's getGradientStyle shows
   * as a CSS preview, but as real canvas pixels -- this is the actual
   * surface the puzzle gets cut from. Before this matched only `gradient`
   * and `difficulty`; `pattern`/`direction` were silently dropped, so
   * every non-default-linear practice puzzle (radial, conic, striped,
   * diamond, checkerboard, dots, and every custom-direction flow) was
   * actually played as a generic diagonal blend -- a different image
   * than the one previewed, with edge characteristics that don't match
   * what the picked pattern would really produce.
   */
  static createPuzzleFromGradient(
    gradient: string[],
    difficulty: Difficulty,
    pattern?: string,
    direction?: string
  ): HTMLCanvasElement {
    const size = 300;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    switch (pattern) {
      case 'radial': {
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / Math.SQRT2);
        gradient.forEach((color, index) => {
          grad.addColorStop(index / (gradient.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        break;
      }

      case 'conic': {
        const grad = ctx.createConicGradient(0, size / 2, size / 2);
        gradient.forEach((color, index) => {
          grad.addColorStop(index / (gradient.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        break;
      }

      case 'diamond': {
        // Matches the CSS conic-gradient(from 45deg at 50% 50%, c0 0deg,
        // c1 90deg, c2 180deg, c1 270deg, c0 360deg) used in the preview.
        const [c0, c1, c2] = gradient;
        const grad = ctx.createConicGradient((45 * Math.PI) / 180, size / 2, size / 2);
        grad.addColorStop(0, c0);
        grad.addColorStop(0.25, c1 ?? c0);
        grad.addColorStop(0.5, c2 ?? c0);
        grad.addColorStop(0.75, c1 ?? c0);
        grad.addColorStop(1, c0);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        break;
      }

      case 'striped': {
        // Hard color bands (not a blend) running bottom-to-top, matching
        // the preview's linear-gradient(0deg, stripeStops).
        const grad = ctx.createLinearGradient(0, size, 0, 0);
        gradient.forEach((color, index) => {
          const start = index / gradient.length;
          const end = (index + 1) / gradient.length;
          grad.addColorStop(start, color);
          grad.addColorStop(end, color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        break;
      }

      case 'checkerboard': {
        const cell = 40;
        const [c0, c1] = gradient;
        for (let y = 0; y < size; y += cell) {
          for (let x = 0; x < size; x += cell) {
            const isEven = ((x / cell) + (y / cell)) % 2 === 0;
            ctx.fillStyle = isEven ? c0 : (c1 ?? c0);
            ctx.fillRect(x, y, cell, cell);
          }
        }
        break;
      }

      case 'dots': {
        const cell = 30;
        const [base, dot] = gradient;
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = dot ?? base;
        for (let y = 0; y < size; y += cell) {
          for (let x = 0; x < size; x += cell) {
            ctx.beginPath();
            ctx.arc(x + cell / 2, y + cell / 2, cell * 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }

      case 'wavy':
      case 'linear':
      default: {
        const effectiveDirection = pattern === 'wavy' ? 'to bottom' : direction;
        const { x0, y0, x1, y1 } = this.linearEndpoints(effectiveDirection, size);
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.forEach((color, index) => {
          grad.addColorStop(index / (gradient.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        break;
      }
    }

    return canvas;
  }

  static createTilesFromCanvas(
    canvas: HTMLCanvasElement,
    difficulty: Difficulty = 'Medium'
  ): Tile[] {
    let attempt = 0;

    while (attempt < this.MAX_ATTEMPTS) {
      const tiles = this.generateTiles(canvas, difficulty);

      if (this.isSolvable(tiles)) {
        return tiles;
      }

      attempt++;
    }

    throw new Error('Unable to generate solvable puzzle');
  }

  private static generateTiles(
    canvas: HTMLCanvasElement,
    difficulty: Difficulty
  ): Tile[] {
    const size = canvas.width / this.GRID;
    const tiles: Tile[] = [];

    for (let row = 0; row < this.GRID; row++) {
      for (let col = 0; col < this.GRID; col++) {
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = size;
        tileCanvas.height = size;

        const ctx = tileCanvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(
          canvas,
          col * size,
          row * size,
          size,
          size,
          0,
          0,
          size,
          size
        );

        // extractEdges' own matchId (`${row}-${col}-${direction}`) is
        // unique per tile+side and so never actually equals another
        // edge's -- real matching for canvas-generated tiles needs a
        // matchId that reflects true grid adjacency instead. Since this
        // canvas is our own deterministic drawing (not an unknown
        // photo), we already know true adjacency for free; override
        // matchId with the same grid-position scheme the real
        // Factory-puzzle path uses (GameLogicService.edgesMatch relies
        // on matchId alone, so this is the only field that needs
        // overriding -- hash/variance/featureScore keep their real,
        // pixel-derived values from extractEdges for complexity scoring).
        const edges = EdgeExtractionService.extractEdges(tileCanvas, row, col);
        const gridMatchIds = this.gridEdgeMatchIds(row, col, this.GRID);
        (Object.keys(gridMatchIds) as (keyof typeof gridMatchIds)[]).forEach((direction) => {
          edges[direction].matchId = gridMatchIds[direction];
        });

        tiles.push({
          id: crypto.randomUUID(),
          row,
          col,
          originalRow: row,
          originalCol: col,
          imageData: tileCanvas.toDataURL(),
          rotation: (this.generateRotation(difficulty) ?? 0) as 0 | 90 | 180 | 270,
          tileSize: size,
          edgeHashes: edges,
          visualComplexity: this.scoreComplexity(edges)
        });
      }
    }

    return this.shuffle(tiles);
  }

  // Deterministic per-seam id for a tile cut at (row, col) in a
  // gridSize x gridSize grid: two tiles that truly touch in the
  // original, unshuffled layout get the same id for their facing edges;
  // outer-border edges (no true neighbor) each get a unique id so they
  // can never falsely match anything. Mirrors useGameState.ts's
  // factoryEdgeMatchIds for the same reason -- see the comment at this
  // method's call site.
  private static gridEdgeMatchIds(
    row: number,
    col: number,
    gridSize: number
  ): { top: string; right: string; bottom: string; left: string } {
    const position = row * gridSize + col;
    return {
      top: row > 0 ? `v-${position - gridSize}` : `boundary-${position}-top`,
      bottom: row < gridSize - 1 ? `v-${position}` : `boundary-${position}-bottom`,
      left: col > 0 ? `h-${position - 1}` : `boundary-${position}-left`,
      right: col < gridSize - 1 ? `h-${position}` : `boundary-${position}-right`
    };
  }

  private static scoreComplexity(edgeData: any): number {
    return (
      (edgeData.top?.featureScore || 0) +
      (edgeData.right?.featureScore || 0) +
      (edgeData.bottom?.featureScore || 0) +
      (edgeData.left?.featureScore || 0)
    );
  }

  static generateRotation(difficulty: Difficulty): 0 | 90 | 180 | 270 {
    switch (difficulty) {
      case 'Easy':
        return 0;
      case 'Medium':
        return (Math.floor(Math.random() * 2) * 90) as 0 | 90 | 180 | 270;
      case 'Hard':
      default:
        return (Math.floor(Math.random() * 4) * 90) as 0 | 90 | 180 | 270;
    }
  }

  private static shuffle(tiles: Tile[]): Tile[] {
    const positions: { row: number; col: number }[] = [];

    for (let row = 0; row < this.GRID; row++) {
      for (let col = 0; col < this.GRID; col++) {
        positions.push({ row, col });
      }
    }

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

  private static isSolvable(tiles: Tile[]): boolean {
    const ids = new Set(tiles.map(t => t.id));
    if (ids.size !== tiles.length) return false;

    const complexity = tiles.reduce(
      (total, t) => total + (t.visualComplexity || 0),
      0
    );

    return complexity > 0;
  }

  static generateValidatedPuzzle(
    gradient: string[],
    difficulty: Difficulty = 'Medium',
    pattern?: string,
    direction?: string
  ): Tile[] {
    const canvas = this.createPuzzleFromGradient(gradient, difficulty, pattern, direction);
    return this.createTilesFromCanvas(canvas, difficulty);
  }
}
