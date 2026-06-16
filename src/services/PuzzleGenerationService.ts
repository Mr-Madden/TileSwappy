import { Tile } from '../models/types';
import { EdgeExtractionService } from './EdgeExtractionService';

export class PuzzleGenerationService {
  private static readonly GRID = 3;

  private static readonly MAX_ATTEMPTS =
    25;

  static createPuzzleFromGradient(
    gradient: string[],
    difficulty: string
  ): HTMLCanvasElement {
    const canvas =
      document.createElement(
        'canvas'
      );

    canvas.width = 300;

    canvas.height = 300;

    const ctx =
      canvas.getContext(
        '2d'
      );

    if (!ctx) {
      throw new Error(
        'Canvas unavailable'
      );
    }

    const grad =
      ctx.createLinearGradient(
        0,
        0,
        300,
        300
      );

    gradient.forEach(
      (
        color,
        index
      ) => {
        grad.addColorStop(
          index /
            (
              gradient.length -
              1
            ),
          color
        );
      }
    );

    ctx.fillStyle =
      grad;

    ctx.fillRect(
      0,
      0,
      300,
      300
    );

    return canvas;
  }

  static createTilesFromCanvas(
    canvas:
      HTMLCanvasElement,
    difficulty =
      'Medium'
  ): Tile[] {
    let attempt =
      0;

    while (
      attempt <
      this.MAX_ATTEMPTS
    ) {
      const tiles =
        this.generateTiles(
          canvas,
          difficulty
        );

      if (
        this.isSolvable(
          tiles
        )
      ) {
        return tiles;
      }

      attempt++;
    }

    throw new Error(
      'Unable to generate solvable puzzle'
    );
  }

  private static generateTiles(
    canvas:
      HTMLCanvasElement,
    difficulty:
      string
  ): Tile[] {
    const size =
      canvas.width /
      this.GRID;

    const tiles:
      Tile[] = [];

    for (
      let row = 0;
      row <
      this.GRID;
      row++
    ) {
      for (
        let col = 0;
        col <
        this.GRID;
        col++
      ) {
        const tileCanvas =
          document.createElement(
            'canvas'
          );

        tileCanvas.width =
          size;

        tileCanvas.height =
          size;

        const ctx =
          tileCanvas.getContext(
            '2d'
          );

        if (!ctx) {
          continue;
        }

        ctx.drawImage(
          canvas,

          col *
            size,

          row *
            size,

          size,

          size,

          0,

          0,

          size,

          size
        );

        const edges =
          EdgeExtractionService.extractEdges(
            tileCanvas,
            row,
            col
          );

        tiles.push({
          id:
            crypto.randomUUID(),

          row,

          col,

          originalRow:
            row,

          originalCol:
            col,

          imageData:
            tileCanvas.toDataURL(),

          rotation:
            this.generateRotation(
              difficulty
            ),

          tileSize:
            size,

          edgeHashes:
            edges,

          visualComplexity:
            this.scoreComplexity(
              edges
            )
        });
      }
    }

    return this.shuffle(
      tiles
    );
  }

  private static scoreComplexity(
    edgeData: any
  ) {
    return (
      (
        edgeData.top
          ?.featureScore ||
        0
      ) +
      (
        edgeData.right
          ?.featureScore ||
        0
      ) +
      (
        edgeData.bottom
          ?.featureScore ||
        0
      ) +
      (
        edgeData.left
          ?.featureScore ||
        0
      )
    );
  }

  private static generateRotation(
    difficulty:
      string
  ) {
    switch (
      difficulty
    ) {
      case 'Easy':
        return 0;

      case 'Medium':
        return (
          Math.floor(
            Math.random() *
              2
          ) * 90
        );

      default:
        return (
          Math.floor(
            Math.random() *
              4
          ) * 90
        );
    }
  }

  private static shuffle(
    tiles:
      Tile[]
  ): Tile[] {
    const positions =
      [];

    for (
      let row = 0;
      row <
      this.GRID;
      row++
    ) {
      for (
        let col = 0;
        col <
        this.GRID;
        col++
      ) {
        positions.push({
          row,
          col
        });
      }
    }

    for (
      let i =
        positions.length -
        1;
      i >
      0;
      i--
    ) {
      const j =
        Math.floor(
          Math.random() *
            (
              i +
              1
            )
        );

      [
        positions[
          i
        ],

        positions[
          j
        ]
      ] =
        [
          positions[
            j
          ],

          positions[
            i
          ]
        ];
    }

    return tiles.map(
      (
        tile,
        index
      ) => ({
        ...tile,

        row:
          positions[
            index
          ].row,

        col:
          positions[
            index
          ].col
      })
    );
  }

  private static isSolvable(
    tiles:
      Tile[]
  ): boolean {
    const ids =
      new Set(
        tiles.map(
          (
            t
          ) =>
            t.id
        )
      );

    if (
      ids.size !==
      tiles.length
    ) {
      return false;
    }

    const complexity =
      tiles.reduce(
        (
          total,
          t
        ) =>
          total +
          (
            t.visualComplexity ||
            0
          ),

        0
      );

    return (
      complexity >
      0
    );
  }

  static generateValidatedPuzzle(
    gradient:
      string[],

    difficulty =
      'Medium'
  ): Tile[] {
    const canvas =
      this.createPuzzleFromGradient(
        gradient,
        difficulty
      );

    return this.createTilesFromCanvas(
      canvas,
      difficulty
    );
  }
}
