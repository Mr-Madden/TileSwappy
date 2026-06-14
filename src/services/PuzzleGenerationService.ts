import { Tile } from '../models/types';
import { EdgeExtractionService } from './EdgeExtractionService';

export class PuzzleGenerationService {
  static createPuzzleFromGradient(
    gradient: string[],
    difficulty: string
  ): HTMLCanvasElement {
    const canvas =
      document.createElement('canvas');

    canvas.width = 300;
    canvas.height = 300;

    const ctx =
      canvas.getContext('2d');

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
      (color, index) => {
        grad.addColorStop(
          index /
            (gradient.length - 1),
          color
        );
      }
    );

    ctx.fillStyle = grad;

    ctx.fillRect(
      0,
      0,
      300,
      300
    );

    return canvas;
  }

  static createTilesFromCanvas(
    canvas: HTMLCanvasElement
  ): Tile[] {
    const size =
      canvas.width / 3;

    const tiles: Tile[] = [];

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

          col * size,

          row * size,

          size,

          size,

          0,

          0,

          size,

          size
        );

        const edgeData =
          EdgeExtractionService.extractEdges(
            tileCanvas,

            row,

            col
          );

        tiles.push({
          id: `${row}-${col}`,

          row,

          col,

          originalRow: row,

          originalCol: col,

          imageData:
            tileCanvas.toDataURL(),

          rotation:
            Math.floor(
              Math.random() * 4
            ),

          tileSize: size,

          edgeHashes:
            edgeData,

          visualComplexity:
            (
              edgeData.top
                .featureScore || 0
            ) +
            (
              edgeData.right
                .featureScore || 0
            ) +
            (
              edgeData.bottom
                .featureScore || 0
            ) +
            (
              edgeData.left
                .featureScore || 0
            )
        });
      }
    }

    return this.shuffle(
      tiles
    );
  }

  private static shuffle(
    tiles: Tile[]
  ): Tile[] {
    const positions =
      [];

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
      i > 0;
      i--
    ) {
      const j =
        Math.floor(
          Math.random() *
            (i + 1)
        );

      [
        positions[i],

        positions[j]
      ] = [
        positions[j],

        positions[i]
      ];
    }

    return tiles.map(
      (
        tile,

        index
      ) => ({
        ...tile,

        row:
          positions[index]
            .row,

        col:
          positions[index]
            .col
      })
    );
  }
}
