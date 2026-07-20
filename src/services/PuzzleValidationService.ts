import { Tile } from '../models/types';

interface GeneratedPuzzle {
  id: string;

  status?: string;

  difficulty?: string;

  tiles: Tile[];
}

export function validateBatch(
  puzzles: GeneratedPuzzle[]
): GeneratedPuzzle[] {
  return puzzles.filter(
    validatePuzzle
  );
}

function validatePuzzle(
  puzzle: GeneratedPuzzle
): boolean {
  if (
    !puzzle.tiles ||
    puzzle.tiles.length === 0
  ) {
    return false;
  }

  if (
    !hasUniqueTileIds(
      puzzle.tiles
    )
  ) {
    return false;
  }

  if (
    !hasUniqueEdges(
      puzzle.tiles
    )
  ) {
    return false;
  }

  if (
    !hasValidRotations(
      puzzle.tiles
    )
  ) {
    return false;
  }

  if (
    !passesComplexity(
      puzzle.tiles
    )
  ) {
    return false;
  }

  return true;
}

function hasUniqueTileIds(
  tiles: Tile[]
): boolean {
  const ids =
    new Set(
      tiles.map(
        t =>
          t.id
      )
    );

  return (
    ids.size ===
    tiles.length
  );
}

function hasUniqueEdges(
  tiles: Tile[]
): boolean {
  const edges =
    new Set(
      tiles.map(
        tile =>
          [
            tile.edgeHashes?.top
              ?.hash,

            tile.edgeHashes?.right
              ?.hash,

            tile.edgeHashes?.bottom
              ?.hash,

            tile.edgeHashes?.left
              ?.hash
          ].join('-')
      )
    );

  return (
    edges.size ===
    tiles.length
  );
}

function hasValidRotations(
  tiles: Tile[]
): boolean {
  return tiles.every(
    tile =>
      [
        0,
        90,
        180,
        270
      ].includes(
        tile.rotation
      )
  );
}

function passesComplexity(
  tiles: Tile[]
): boolean {
  const total =
    tiles.reduce(
      (
        sum,
        tile
      ) =>
        sum +
        (
          tile.visualComplexity ||
          0
        ),

      0
    );

  return (
    total >
    50
  );
}
