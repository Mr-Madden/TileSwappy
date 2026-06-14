import {
  Tile,
  EdgeData,
  Move
} from '../models/types';

export class GameLogicService {
  static getRotatedEdge(
    tile: Tile,

    direction:
      | 'top'
      | 'right'
      | 'bottom'
      | 'left'
  ): EdgeData {
    const directions =
      [
        'top',

        'right',

        'bottom',

        'left'
      ];

    const index =
      directions.indexOf(
        direction
      );

    const original =
      (
        index -
        tile.rotation +
        4
      ) %
      4;

    return tile.edgeHashes[
      directions[
        original
      ] as keyof typeof tile.edgeHashes
    ];
  }

  static edgesMatch(
    edge1: EdgeData,

    edge2: EdgeData
  ): boolean {
    return (
      edge1.matchId ===
      edge2.matchId
    );
  }

  static isEdgeMatch(
    tile1: Tile,

    tile2: Tile,

    direction:
      | 'top'
      | 'right'
      | 'bottom'
      | 'left'
  ) {
    const opposite = {
      top: 'bottom',

      right: 'left',

      bottom: 'top',

      left: 'right'
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
        ] as any
      );

    return this.edgesMatch(
      edge1,

      edge2
    );
  }

  static checkEdgeMatches(
    tiles: Tile[]
  ) {
    const matches =
      new Set<string>();

    for (
      let row = 0;
      row < 3;
      row++
    ) {
      for (
        let col = 0;
        col < 3;
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
            `${row}-${col}-right`
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
            `${row}-${col}-bottom`
          );
        }
      }
    }

    return matches;
  }

  static rotateTile(
    tiles: Tile[],

    tileId: string,

    amount: number
  ) {
    return tiles.map(
      tile =>
        tile.id ===
        tileId
          ? {
              ...tile,

              rotation:
                (
                  tile.rotation +
                  amount +
                  4
                ) %
                4
            }
          : tile
    );
  }

  static undoMove(
    tiles: Tile[],

    move: Move
  ) {
    return tiles;
  }
}
