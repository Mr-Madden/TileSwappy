import { EdgeData } from '../models/types';

interface ExtendedEdgeData extends EdgeData {
  confidence?: number;

  complexity?: number;
}

export class EdgeExtractionService {
  static extractEdges(
    canvas: HTMLCanvasElement,
    row: number,
    col: number
  ): {
    top: ExtendedEdgeData;
    right: ExtendedEdgeData;
    bottom: ExtendedEdgeData;
    left: ExtendedEdgeData;
  } {
    const ctx =
      canvas.getContext(
        '2d'
      );

    if (!ctx) {
      throw new Error(
        'Canvas context unavailable'
      );
    }

    const width =
      canvas.width;

    const height =
      canvas.height;

    return {
      top:
        this.createEdge(
          ctx.getImageData(
            0,
            0,
            width,
            1
          ).data,

          `${row}-${col}-top`
        ),

      right:
        this.createEdge(
          ctx.getImageData(
            width - 1,
            0,
            1,
            height
          ).data,

          `${row}-${col}-right`
        ),

      bottom:
        this.createEdge(
          ctx.getImageData(
            0,
            height - 1,
            width,
            1
          ).data,

          `${row}-${col}-bottom`
        ),

      left:
        this.createEdge(
          ctx.getImageData(
            0,
            0,
            1,
            height
          ).data,

          `${row}-${col}-left`
        )
    };
  }

  private static createEdge(
    data:
      Uint8ClampedArray,

    matchId:
      string
  ): ExtendedEdgeData {
    const variance =
      this.calculateVariance(
        data
      );

    const featureScore =
      this.calculateFeatureScore(
        data
      );

    return {
      hash:
        this.hashPixels(
          data
        ),

      matchId,

      variance,

      featureScore,

      dominantColor:
        this.extractDominantColor(
          data
        ),

      confidence:
        this.calculateConfidence(
          variance,

          featureScore
        ),

      complexity:
        Math.round(
          (
            variance +
            featureScore
          ) /
            2
        )
    };
  }

  private static hashPixels(
    pixels:
      Uint8ClampedArray
  ): string {
    let hash =
      2166136261;

    for (
      let i = 0;
      i <
      pixels.length;
      i++
    ) {
      hash ^=
        pixels[
          i
        ];

      hash +=
        (hash <<
          1) +
        (hash <<
          4) +
        (hash <<
          7) +
        (hash <<
          8) +
        (hash <<
          24);
    }

    return (
      hash >>>
      0
    ).toString(
      16
    );
  }

  private static calculateVariance(
    pixels:
      Uint8ClampedArray
  ): number {
    const values:
      number[] =
      [];

    for (
      let i = 0;
      i <
      pixels.length;
      i += 4
    ) {
      values.push(
        (
          pixels[
            i
          ] +
          pixels[
            i +
              1
          ] +
          pixels[
            i +
              2
          ]
        ) /
          3
      );
    }

    const avg =
      values.reduce(
        (
          a,
          b
        ) =>
          a +
          b,

        0
      ) /
      values.length;

    const variance =
      values.reduce(
        (
          total,
          value
        ) =>
          total +
          Math.pow(
            value -
              avg,

            2
          ),

        0
      ) /
      values.length;

    return Math.round(
      variance
    );
  }

  private static calculateFeatureScore(
    pixels:
      Uint8ClampedArray
  ): number {
    let score =
      0;

    for (
      let i = 4;
      i <
      pixels.length;
      i += 4
    ) {
      const r =
        Math.abs(
          pixels[
            i
          ] -
            pixels[
              i -
                4
            ]
        );

      const g =
        Math.abs(
          pixels[
            i +
              1
          ] -
            pixels[
              i -
                3
            ]
        );

      const b =
        Math.abs(
          pixels[
            i +
              2
          ] -
            pixels[
              i -
                2
            ]
        );

      score +=
        r +
        g +
        b;
    }

    return Math.round(
      score /
        300
    );
  }

  private static extractDominantColor(
    pixels:
      Uint8ClampedArray
  ): string {
    let r =
      0;

    let g =
      0;

    let b =
      0;

    let count =
      0;

    for (
      let i = 0;
      i <
      pixels.length;
      i += 4
    ) {
      r +=
        pixels[
          i
        ];

      g +=
        pixels[
          i +
            1
        ];

      b +=
        pixels[
          i +
            2
        ];

      count++;
    }

    return `rgb(${Math.round(
      r /
        count
    )}, ${Math.round(
      g /
        count
    )}, ${Math.round(
      b /
        count
    )})`;
  }

  private static calculateConfidence(
    variance:
      number,

    feature:
      number
  ): number {
    const score =
      (
        variance *
          0.4 +
        feature *
          0.6
      ) /
      100;

    return Math.max(
      0,

      Math.min(
        1,

        Number(
          score.toFixed(
            2
          )
        )
      )
    );
  }
}
