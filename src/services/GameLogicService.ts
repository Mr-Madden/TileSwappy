import {
  Tile,
  EdgeData,
  Move,
  HintMove
} from '../models/types';

type Direction =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left';

const DIRECTIONS: Direction[] = [
  'top',
  'right',
  'bottom',
  'left'
];

export class GameLogicService {
  static getRotatedEdge(
    tile: Tile,
    direction: Direction
  ): EdgeData {
    const directionIndex =
      DIRECTIONS.indexOf(direction);

    const rotationSteps =
      tile.rotation / 90;

    const original =
      (directionIndex - rotationSteps + 4) % 4;

    return tile.edgeHashes[
      DIRECTIONS[original]
    ];
  }

  // matchId is a required field, assigned deterministically by every
  // puzzle-generation path (the Factory path's factoryEdgeMatchIds and
  // the canvas path's gridEdgeMatchIds) from true grid adjacency at cut
  // time -- it is always present and always authoritative, so it's the
  // sole determinant here. An earlier version of this method also fell
  // back to raw hash equality and a variance/featureScore proximity
  // check for edges without a reliable matchId; that fallback is what
  // produced this bug's false positives -- on a fresh shuffle, unrelated
  // tiles would frequently glow as "matched" purely because their
  // synthetic variance/featureScore values landed within the fuzzy
  // threshold by coincidence (pigeonhole: ~36 edge values crammed into a
  // 0-99 range collide within a threshold of 20 often). Since no
  // generation path has ever needed that fallback (extractEdges' own
  // per-tile-unique matchId is unconditionally overridden before use),
  // removing it fixes the false positives at the root instead of trying
  // to scramble the fallback inputs further apart.
  static edgesMatch(
    edge1: EdgeData,
    edge2: EdgeData
  ): boolean {
    return edge1.matchId === edge2.matchId;
  }

  // Shared key format for a physical grid seam -- used by both the
  // producer (checkEdgeMatches) and the consumer (GameBoard's overlay
  // render) so they can never drift apart the way tile.id-based keys
  // and a bare-tile.id lookup once did.
  static seamKey(
    row: number,
    col: number,
    direction: 'right' | 'bottom'
  ): string {
    return `${row}:${col}:${direction}`;
  }

  static isEdgeMatch(
    tile1: Tile,
    tile2: Tile,
    direction: Direction
  ): boolean {
    const opposite: Record<Direction, Direction> = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right'
    };

    const edge1 =
      this.getRotatedEdge(tile1, direction);

    const edge2 =
      this.getRotatedEdge(tile2, opposite[direction]);

    return this.edgesMatch(edge1, edge2);
  }

  static checkEdgeMatches(
    tiles: Tile[]
  ): Set<string> {
    const matches = new Set<string>();

    const maxRow =
      Math.max(...tiles.map(t => t.row));

    const maxCol =
      Math.max(...tiles.map(t => t.col));

    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col <= maxCol; col++) {
        const current =
          tiles.find(t => t.row === row && t.col === col);

        if (!current) continue;

        const right =
          tiles.find(t => t.row === row && t.col === col + 1);

        if (right && this.isEdgeMatch(current, right, 'right')) {
          matches.add(this.seamKey(row, col, 'right'));
        }

        const bottom =
          tiles.find(t => t.row === row + 1 && t.col === col);

        if (bottom && this.isEdgeMatch(current, bottom, 'bottom')) {
          matches.add(this.seamKey(row, col, 'bottom'));
        }
      }
    }

    return matches;
  }

  static rotateTile(
    tiles: Tile[],
    tileId: string,
    amount: number
  ): Tile[] {
    return tiles.map(tile => {
      if (tile.id !== tileId) {
        return tile;
      }

      const next =
        ((tile.rotation + amount + 360) % 360) as 0 | 90 | 180 | 270;

      return {
        ...tile,
        rotation: next
      };
    });
  }

  static swapTiles(
    tiles: Tile[],
    tile1Id: string,
    tile2Id: string
  ): Tile[] {
    const first =
      tiles.find(t => t.id === tile1Id);

    const second =
      tiles.find(t => t.id === tile2Id);

    if (!first || !second) {
      return tiles;
    }

    return tiles.map(tile => {
      if (tile.id === first.id) {
        return {
          ...tile,
          row: second.row,
          col: second.col
        };
      }

      if (tile.id === second.id) {
        return {
          ...tile,
          row: first.row,
          col: first.col
        };
      }

      return tile;
    });
  }

  static isSolved(
    tiles: Tile[]
  ): boolean {
    // A win is now purely "every edge matches" -- deliberately relaxed
    // from the stricter "every tile back at its exact original position
    // and rotation" check this used to be. That stricter version silently
    // rejected a real, reachable player state: for artwork without an
    // obvious "up" (abstract patterns, space/nebula themes -- this game's
    // actual catalog leans heavily this way), a player can easily land on
    // the whole assembled picture rotated 90/180/270 as a unit. Every
    // edge glows, the picture looks completely coherent, and the old
    // check rejected it with zero feedback -- reported as "nothing
    // happens when I finish," every time, not a rare edge case.
    //
    // This is safe from false positives: matchId is unique per true
    // adjacent pair (assigned once at generation time from real grid
    // adjacency), so a tile's edge can only satisfy this via a genuinely
    // correct neighbor -- never a coincidental match with an unrelated
    // tile. Reaching every seam matched still requires having solved the
    // picture's true relative arrangement; only the requirement that it
    // also face the one specific "upright" rotation is now dropped.
    const gridSize = Math.round(Math.sqrt(tiles.length)) || 1;
    const totalInternalSeams = 2 * gridSize * (gridSize - 1);
    return this.checkEdgeMatches(tiles).size === totalInternalSeams;
  }

  // The single rotate-or-swap action that increases the matched-edge count
  // the most. Deliberately only one primitive move (never a combined
  // swap+rotate) so the result maps directly onto the existing Move
  // history shape -- a hint plays back through undoLastMove exactly like
  // a move the player made themselves. Returns null when no single move
  // helps (already solved, or the next step genuinely needs a multi-move
  // sequence) rather than guessing.
  //
  // Among moves that gain the same number of matches, the least
  // disruptive one wins: a rotation only moves one tile in place, and a
  // swap between two tiles that are already near each other reads as a
  // normal nearby move. A swap between two tiles on opposite sides of the
  // board is just as valid but -- with no move animation -- teleports two
  // tiles across the grid at once, which reads as a glitch rather than
  // help. Gain always wins first; disruption is only a tiebreaker, so
  // this never trades away a better hint for a calmer-looking worse one.
  static findHintMove(tiles: Tile[]): HintMove | null {
    const baseline = this.checkEdgeMatches(tiles).size;
    let bestGain = 0;
    let bestDisruption = Infinity;
    let bestMove: HintMove | null = null;

    const consider = (gain: number, disruption: number, move: HintMove) => {
      if (gain > bestGain || (gain > 0 && gain === bestGain && disruption < bestDisruption)) {
        bestGain = gain;
        bestDisruption = disruption;
        bestMove = move;
      }
    };

    for (const tile of tiles) {
      for (const amount of [90, 180, 270] as const) {
        const next = this.rotateTile(tiles, tile.id, amount);
        const gain = this.checkEdgeMatches(next).size - baseline;
        consider(gain, 0, { type: 'rotate', tileId: tile.id, amount });
      }
    }

    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const a = tiles[i];
        const b = tiles[j];
        const next = this.swapTiles(tiles, a.id, b.id);
        const gain = this.checkEdgeMatches(next).size - baseline;
        const distance = Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
        consider(gain, distance, { type: 'swap', tile1Id: a.id, tile2Id: b.id });
      }
    }

    return bestMove;
  }

  static undoMove(
    tiles: Tile[],
    move: Move
  ): Tile[] {
    if (move.type === 'rotate') {
      if (!move.tileId || move.previousRotation === undefined) {
        return tiles;
      }
      return tiles.map(tile =>
        tile.id === move.tileId
        ? { ...tile, rotation: (move.previousRotation ?? 0) as 0 | 90 | 180 | 270 }
        : tile
      );
    }

    if (move.type === 'swap') {
      if (
        !move.tile1Id ||
        !move.tile2Id ||
        !move.tile1PrevPos ||
        !move.tile2PrevPos
      ) {
        return tiles;
      }

      return tiles.map(tile => {
        if (tile.id === move.tile1Id && move.tile1PrevPos) {
          return {
            ...tile,
            row: move.tile1PrevPos.row,
            col: move.tile1PrevPos.col
          };
        }

        if (tile.id === move.tile2Id && move.tile2PrevPos) {
          return {
            ...tile,
            row: move.tile2PrevPos.row,
            col: move.tile2PrevPos.col
          };
        }

        return tile;
      });
    }

    return tiles;
  }
}
