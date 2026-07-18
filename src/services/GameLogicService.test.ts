import { GameLogicService } from './GameLogicService';
import { Tile, EdgeData } from '../models/types';

// Builds a 3x3 fixture where every internal edge pair gets its own
// globally unique matchId -- so the true solved arrangement is
// provably the only placement where every adjacent pair matches. This
// mirrors the Factory's own Solver test fixture
// (build_unique_solution_tile_set in tests/unit/solver/test_solver.py)
// used to prove the same rotation-equivalence bug there.
function edge(matchId: string): EdgeData {
  return { hash: matchId, matchId };
}

function blank(): EdgeData {
  return edge('outer-unused');
}

function buildSolvedTiles(): Tile[] {
  // Internal edges, row-major 3x3 (same convention as the Factory's
  // pattern_analyzer.geometry.INTERNAL_EDGES): each entry names the
  // shared matchId between the two tiles' facing sides.
  const tiles: Record<number, Partial<Tile>> = {};
  for (let i = 0; i < 9; i++) tiles[i] = {};

  const setEdge = (
    index: number,
    side: 'top' | 'right' | 'bottom' | 'left',
    matchId: string
  ) => {
    (tiles[index] as any)[side] = edge(matchId);
  };

  // Horizontal adjacencies (right/left)
  [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
    [6, 7],
    [7, 8]
  ].forEach(([a, b], i) => {
    const id = `h-${i}`;
    setEdge(a, 'right', id);
    setEdge(b, 'left', id);
  });

  // Vertical adjacencies (bottom/top)
  [
    [0, 3],
    [3, 6],
    [1, 4],
    [4, 7],
    [2, 5],
    [5, 8]
  ].forEach(([a, b], i) => {
    const id = `v-${i}`;
    setEdge(a, 'bottom', id);
    setEdge(b, 'top', id);
  });

  const result: Tile[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const built = tiles[index] as any;
      result.push({
        id: `tile-${index}`,
        row,
        col,
        originalRow: row,
        originalCol: col,
        imageData: '',
        rotation: 0,
        tileSize: 100,
        edgeHashes: {
          top: built.top ?? blank(),
          right: built.right ?? blank(),
          bottom: built.bottom ?? blank(),
          left: built.left ?? blank()
        }
      });
    }
  }
  return result;
}

// Whole-board rotation permutation, empirically the same mapping the
// Factory's own Solver derived and verified (ADR 0011 /
// grid_position_permutation): rotating the assembled 3x3 board 90deg
// clockwise moves position i to this new position.
const BOARD_ROTATION_90: Record<number, number> = {
  0: 2,
  1: 5,
  2: 8,
  3: 1,
  4: 4,
  5: 7,
  6: 0,
  7: 3,
  8: 6
};

function rotateWholeBoard(tiles: Tile[]): Tile[] {
  return tiles.map(tile => {
    const index = tile.originalRow * 3 + tile.originalCol;
    const newIndex = BOARD_ROTATION_90[index];
    const newRow = Math.floor(newIndex / 3);
    const newCol = newIndex % 3;
    return {
      ...tile,
      row: newRow,
      col: newCol,
      rotation: ((tile.rotation + 90) % 360) as 0 | 90 | 180 | 270
    };
  });
}

describe('GameLogicService.isSolved', () => {
  it('returns true for the true solved arrangement', () => {
    const tiles = buildSolvedTiles();
    expect(GameLogicService.isSolved(tiles)).toBe(true);
  });

  it('reports 12/12 edge matches for the true solved arrangement', () => {
    const tiles = buildSolvedTiles();
    expect(GameLogicService.checkEdgeMatches(tiles).size).toBe(12);
  });

  it('does NOT treat a whole-board rotation as solved, even though every edge still matches', () => {
    const solved = buildSolvedTiles();
    const rotated = rotateWholeBoard(solved);

    // The bug this guards against: rotating a fully-matched picture as
    // a whole never breaks an internal seam, so edge-match count alone
    // is still 12/12 here.
    expect(GameLogicService.checkEdgeMatches(rotated).size).toBe(12);

    // But no tile is at its true original position/rotation, so this
    // must NOT register as a win.
    expect(GameLogicService.isSolved(rotated)).toBe(false);
  });

  it('does not treat an arbitrary scrambled arrangement as solved', () => {
    const tiles = buildSolvedTiles();
    const scrambled = tiles.map((tile, i, arr) => ({
      ...tile,
      row: arr[(i + 1) % arr.length].originalRow,
      col: arr[(i + 1) % arr.length].originalCol
    }));

    expect(GameLogicService.isSolved(scrambled)).toBe(false);
  });
});

// Regression coverage for the id-mismatch bug: checkEdgeMatches used to
// key its Set by `${tile.id}-right`/`${tile.id}-bottom` (a random
// per-tile UUID + suffix), while GameBoard.tsx looked up the bare
// tile.id -- a value that never appeared in the set, so the match
// indicator silently never fired for ANY puzzle. The fix is a shared
// `seamKey(row, col, direction)` producer/consumer format; these tests
// lock in both the format and which specific seams are (and aren't)
// reported, not just the total count (which is all the pre-existing
// tests above ever checked).
describe('GameLogicService.checkEdgeMatches key format', () => {
  it('keys every match as a deterministic row:col:direction seam id', () => {
    const tiles = buildSolvedTiles();
    const matches = GameLogicService.checkEdgeMatches(tiles);

    expect(matches.size).toBe(12);
    matches.forEach(key => {
      expect(key).toMatch(/^\d+:\d+:(right|bottom)$/);
    });
  });

  it('reports the exact 12 seam keys for the true solved arrangement', () => {
    const tiles = buildSolvedTiles();
    const matches = GameLogicService.checkEdgeMatches(tiles);

    const expectedRight = ['0:0:right', '0:1:right', '1:0:right', '1:1:right', '2:0:right', '2:1:right'];
    const expectedBottom = ['0:0:bottom', '0:1:bottom', '0:2:bottom', '1:0:bottom', '1:1:bottom', '1:2:bottom'];

    [...expectedRight, ...expectedBottom].forEach(key => {
      expect(matches.has(key)).toBe(true);
    });
    expect(matches.size).toBe(expectedRight.length + expectedBottom.length);
  });

  it('omits exactly the seam whose edge no longer matches, keeping the rest', () => {
    const tiles = buildSolvedTiles();

    // Break only the seam between (0,1) and (1,1) -- tile index 1's
    // bottom vs tile index 4's top, originally shared matchId "v-2".
    // variance/featureScore are set explicitly (not left undefined) so
    // edgesMatch's fallback comparison genuinely evaluates a mismatch,
    // rather than both sides defaulting to 0 and trivially "matching".
    const broken = tiles.map(tile => {
      if (tile.row === 1 && tile.col === 1) {
        return {
          ...tile,
          edgeHashes: {
            ...tile.edgeHashes,
            top: { hash: 'broken', matchId: 'broken', variance: 200, featureScore: 200 }
          }
        };
      }
      return tile;
    });

    const matches = GameLogicService.checkEdgeMatches(broken);

    expect(matches.has('0:1:bottom')).toBe(false);
    expect(matches.size).toBe(11);

    const stillMatched = ['0:0:right', '0:1:right', '1:0:right', '1:1:right', '2:0:right', '2:1:right',
      '0:0:bottom', '0:2:bottom', '1:0:bottom', '1:1:bottom', '1:2:bottom'];
    stillMatched.forEach(key => {
      expect(matches.has(key)).toBe(true);
    });
  });
});
