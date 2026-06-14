import { Tile } from '../models/types';

export class PuzzleMetadataService {
  static calculateTileComplexity(
    tiles: Tile[]
  ): number {
    if (!tiles.length) {
      return 0;
    }

    const total =
      tiles.reduce(
        (sum, tile) =>
          sum +
          (tile.visualComplexity ||
            0),
        0
      );

    return total / tiles.length;
  }

  static calculateUniqueness(
    tiles: Tile[]
  ): number {
    const hashes = new Set();

    tiles.forEach(tile => {
      Object.values(
        tile.edgeHashes
      ).forEach(edge =>
        hashes.add(edge.hash)
      );
    });

    return Math.round(
      (hashes.size /
        (tiles.length * 4)) *
        100
    );
  }

  static estimateDifficulty(
    uniqueness: number,
    complexity: number
  ) {
    const score =
      uniqueness * 0.6 +
      complexity * 0.4;

    if (score < 35) {
      return 'Easy';
    }

    if (score < 70) {
      return 'Medium';
    }

    return 'Hard';
  }
}
