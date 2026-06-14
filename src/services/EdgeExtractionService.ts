export interface EdgeData {
  hash: string;

  matchId: string;

  variance?: number;

  featureScore?: number;

  dominantColor?: string;
}

export class EdgeExtractionService {
  static extractEdges(
    canvas: HTMLCanvasElement,
    row: number,
    col: number
  ) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    const width = canvas.width;
    const height = canvas.height;

    return {
      top: this.createEdge(
        ctx.getImageData(0, 0, width, 1).data,
        `${row}-${col}-top`
      ),

      right: this.createEdge(
        ctx.getImageData(width - 1, 0, 1, height).data,
        `${row}-${col}-right`
      ),

      bottom: this.createEdge(
        ctx.getImageData(0, height - 1, width, 1).data,
        `${row}-${col}-bottom`
      ),

      left: this.createEdge(
        ctx.getImageData(0, 0, 1, height).data,
        `${row}-${col}-left`
      )
    };
  }

  private static createEdge(
    data: Uint8ClampedArray,
    matchId: string
  ): EdgeData {
    return {
      hash: this.hashPixels(data),

      matchId,

      variance: this.calculateVariance(data),

      featureScore: this.calculateFeatureScore(data),

      dominantColor: this.extractDominantColor(data)
    };
  }

  private static hashPixels(
    pixels: Uint8ClampedArray
  ): string {
    let hash = 0;

    for (let i = 0; i < pixels.length; i++) {
      hash = ((hash << 5) - hash + pixels[i]) | 0;
    }

    return Math.abs(hash).toString(16);
  }

  private static calculateVariance(
    pixels: Uint8ClampedArray
  ): number {
    const values = [];

    for (let i = 0; i < pixels.length; i += 4) {
      values.push(
        (pixels[i] +
          pixels[i + 1] +
          pixels[i + 2]) /
          3
      );
    }

    const avg =
      values.reduce((a, b) => a + b, 0) /
      values.length;

    const variance =
      values.reduce(
        (sum, v) =>
          sum + Math.pow(v - avg, 2),
        0
      ) / values.length;

    return Math.round(variance);
  }

  private static calculateFeatureScore(
    pixels: Uint8ClampedArray
  ): number {
    let score = 0;

    for (
      let i = 4;
      i < pixels.length;
      i += 4
    ) {
      score += Math.abs(
        pixels[i] - pixels[i - 4]
      );
    }

    return Math.round(score / 100);
  }

  private static extractDominantColor(
    pixels: Uint8ClampedArray
  ) {
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
      count++;
    }

    return `rgb(
${Math.round(r / count)},
${Math.round(g / count)},
${Math.round(b / count)}
)`;
  }
}
