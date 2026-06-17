import {
  Tile,
  EdgeData,
  Move
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
      DIRECTIONS.indexOf(
        direction
      );

    const rotationSteps =
      tile.rotation / 90;

    const original =
      (
        directionIndex -
        rotationSteps +
        4
      ) %
      4;

    return tile.edgeHashes[
      DIRECTIONS[
        original
      ]
    ];
  }

  static edgesMatch(
    edge1: EdgeData,
    edge2: EdgeData
  ): boolean {
    if (
      edge1.matchId ===
      edge2.matchId
    ) {
      return true;
    }

    if (
      edge1.hash ===
      edge2.hash
    ) {
      return true;
    }

    const varianceDiff =
      Math.abs(
        (
          edge1
            .variance ??
          0
        ) -
          (
            edge2
              .variance ??
            0
          )
      );

    const featureDiff =
      Math.abs(
        (
          edge1
            .featureScore ??
          0
        ) -
          (
            edge2
              .featureScore ??
            0
          )
      );

    return (
      varianceDiff <
        20 &&
      featureDiff <
        15
    );
  }

  static isEdgeMatch(
    tile1: Tile,
    tile2: Tile,
    direction: Direction
  ): boolean {
    const opposite:
      Record<
        Direction,
        Direction
      > = {
      top:
        'bottom',

      right:
        'left',

      bottom:
        'top',

      left:
        'right'
    };

    const edge1 =
      this.getRotatedEdge(
        tile1,
        direction
      );

    const edge2 =
      this.getRotatedEdge(
        tile2,
        opposite[
          direction
        ]
      );

    return this.edgesMatch(
      edge1,
      edge2
    );
  }

  static checkEdgeMatches(
    tiles: Tile[]
  ): Set<string> {
    const matches =
      new Set<
        string
      >();

    const maxRow =
      Math.max(
        ...tiles.map(
          t =>
            t.row
        )
      );

    const maxCol =
      Math.max(
        ...tiles.map(
          t =>
            t.col
        )
      );

    for (
      let row = 0;
      row <= maxRow;
      row++
    ) {
      for (
        let col = 0;
        col <= maxCol;
        col++
      ) {
        const current =
          tiles.find(
            t =>
              t.row ===
                row &&
              t.col ===
                col
          );

        if (
          !current
        ) {
          continue;
        }

        const right =
          tiles.find(
            t =>
              t.row ===
                row &&
              t.col ===
                col +
                  1
          );

        if (
          right &&
          this.isEdgeMatch(
            current,
            right,
            'right'
          )
        ) {
          matches.add(
            `${current.id}-right`
          );
        }

        const bottom =
          tiles.find(
            t =>
              t.row ===
                row +
                  1 &&
              t.col ===
                col
          );

        if (
          bottom &&
          this.isEdgeMatch(
            current,
            bottom,
            'bottom'
          )
        ) {
          matches.add(
            `${current.id}-bottom`
          );
        }
      }
    }

    return matches;
  }

  static rotateTile(
    tiles: Tile[],
    tileId: string,
    amount = 90
  ): Tile[] {
    return tiles.map(
      tile => {
        if (
          tile.id !==
          tileId
        ) {
          return tile;
        }

        const next =
          (
            tile.rotation +
            amount +
            360
          ) %
          360;

        return {
          ...tile,

          rotation:
            next as
              | 0
              | 90
              | 180
              | 270
        };
      }
    );
  }

  static swapTiles(
    tiles: Tile[],
    tile1Id: string,
    tile2Id: string
  ): Tile[] {
    const first =
      tiles.find(
        t =>
          t.id ===
          tile1Id
      );

    const second =
      tiles.find(
        t =>
          t.id ===
          tile2Id
      );

    if (
      !first ||
      !second
    ) {
      return tiles;
    }

    return tiles.map(
      tile => {
        if (
          tile.id ===
          first.id
        ) {
          return {
            ...tile,

            row:
              second.row,

            col:
              second.col
          };
        }

        if (
          tile.id ===
          second.id
        ) {
          return {
            ...tile,

            row:
              first.row,

            col:
              first.col
          };
        }

        return tile;
      }
    );
  }

  static isSolved(
    tiles: Tile[]
  ): boolean {
    const matches =
      this.checkEdgeMatches(
        tiles
      );

    const expected =
      12;

    return (
      matches.size >=
      expected
    );
  }

  static undoMove(
    tiles: Tile[],
    move: Move
  ): Tile[] {
    if (
      move.type ===
      'rotate'
    ) {
      if (
        !move.tileId ||
        move.previousRotation ===
          undefined
      ) {
        return tiles;
      }

      return tiles.map(
        tile =>
          tile.id ===
          move.tileId
            ? {
                ...tile,

                rotation:
                  move.previousRotation
              }
            : tile
      );
    }

    if (
      move.type ===
      'swap'
    ) {
      if (
        !move.tile1Id ||
        !move.tile2Id ||
        !move.tile1PrevPos ||
        !move.tile2PrevPos
      ) {
        return tiles;
      }

      return tiles.map(
        tile => {
          if (
            tile.id ===
            move.tile1Id
          ) {
            return {
              ...tile,

              row:
                move
                  .tile1PrevPos
                  .row,

              col:
                move
                  .tile1PrevPos
                  .col
            };
          }

          if (
            tile.id ===
            move.tile2Id
          ) {
            return {
              ...tile,

              row:
                move
                  .tile2PrevPos
                  .row,

              col:
                move
                  .tile2PrevPos
                  .col
            };
          }

          return tile;
        }
      );
    }

    return tiles;
  }
}
