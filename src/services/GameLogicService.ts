import { Tile, Move } from '../models/types';

export class GameLogicService {
  static getRotatedEdgeHash(tile: Tile, direction: string): string {
    const directions = ['top', 'right', 'bottom', 'left'];
    const currentIndex = directions.indexOf(direction);
    const originalIndex = (currentIndex - tile.rotation + 4) % 4;
    return tile.edgeHashes[directions[originalIndex] as keyof typeof tile.edgeHashes];
  }

  static doEdgesMatch(
  edge1: EdgeData,
  edge2: EdgeData
  ): boolean {
  return edge1.matchId === edge2.matchId;
}

  static isEdgeMatch(tile1: Tile, tile2: Tile, direction: string): boolean {
    const oppositeDir: Record<string, string> = {
      'right': 'left',
      'bottom': 'top',
      'left': 'right',
      'top': 'bottom'
    };
    
    const edge1 = this.getRotatedEdge(tile1, direction);
    const edge1 = this.getRotatedEdge(tile2, oppositeDir[direction]);
    return this.shouldEdgesMatch(edge1, edge2);
  }

  static checkEdgeMatches(tiles: Tile[]): Set<string> {
    const matches = new Set<string>();
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const currentTile = tiles.find(t => t.row === row && t.col === col);
        if (!currentTile) continue;
        
        if (col < 2) {
          const rightTile = tiles.find(t => t.row === row && t.col === col + 1);
          if (rightTile && this.isEdgeMatch(currentTile, rightTile, 'right')) {
            matches.add(`${row}-${col}-right`);
          }
        }
        
        if (row < 2) {
          const bottomTile = tiles.find(t => t.row === row + 1 && t.col === col);
          if (bottomTile && this.isEdgeMatch(currentTile, bottomTile, 'bottom')) {
            matches.add(`${row}-${col}-bottom`);
          }
        }
      }
    }
    
    return matches;
  }

  static isPuzzleSolved(tiles: Tile[]): boolean {
    if (tiles.length !== 9) return false;
    
    // Check all 4 possible global rotations
    for (let globalRotation = 0; globalRotation < 4; globalRotation++) {
      if (this.checkSolutionWithGlobalRotation(tiles, globalRotation)) {
        return true;
      }
    }
    
    return false;
  }

  static checkSolutionWithGlobalRotation(tiles: Tile[], globalRotation: number): boolean {
    // Create virtually rotated tiles
    const rotatedTiles = tiles.map(tile => ({
      ...tile,
      rotation: (tile.rotation + globalRotation) % 4
    }));
    
    // Check if all edges match with this global rotation
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const currentTile = rotatedTiles.find(t => t.row === row && t.col === col);
        if (!currentTile) return false;
        
        if (col < 2) {
          const rightTile = rotatedTiles.find(t => t.row === row && t.col === col + 1);
          if (!rightTile || !this.isEdgeMatch(currentTile, rightTile, 'right')) {
            return false;
          }
        }
        
        if (row < 2) {
          const bottomTile = rotatedTiles.find(t => t.row === row + 1 && t.col === col);
          if (!bottomTile || !this.isEdgeMatch(currentTile, bottomTile, 'bottom')) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  static rotateTile(tiles: Tile[], tileId: string, direction: number): Tile[] {
    return tiles.map(tile => 
      tile.id === tileId 
        ? { ...tile, rotation: (tile.rotation + direction + 4) % 4 } 
        : tile
    );
  }

  static swapTiles(tiles: Tile[], tile1Id: string, tile2Id: string): Tile[] {
    const tile1 = tiles.find(t => t.id === tile1Id);
    const tile2 = tiles.find(t => t.id === tile2Id);
    
    if (!tile1 || !tile2) return tiles;
    
    return tiles.map(tile => {
      if (tile.id === tile1.id) return { ...tile, row: tile2.row, col: tile2.col };
      if (tile.id === tile2.id) return { ...tile, row: tile1.row, col: tile1.col };
      return tile;
    });
  }
  
  static undoMove(tiles: Tile[], move: Move): Tile[] {
    if (move.type === 'rotate' && move.tileId !== undefined && move.previousRotation !== undefined) {
      return tiles.map(tile =>
        tile.id === move.tileId ? { ...tile, rotation: move.previousRotation as number } : tile
      );
    } else if (move.type === 'swap' && move.tile1Id && move.tile2Id && move.tile1PrevPos && move.tile2PrevPos) {
      return tiles.map(tile => {
        if (tile.id === move.tile1Id) {
          return { ...tile, row: move.tile1PrevPos!.row, col: move.tile1PrevPos!.col };
        }
        if (tile.id === move.tile2Id) {
          return { ...tile, row: move.tile2PrevPos!.row, col: move.tile2PrevPos!.col };
        }
        return tile;
      });
    }
    return tiles;
  }

  static shuffleAllTiles(tiles: Tile[]): Tile[] {
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
    
    return tiles.map((tile, index) => ({
      ...tile,
      row: positions[index].row,
      col: positions[index].col,
      rotation: Math.floor(Math.random() * 4)
    }));
  }
}
