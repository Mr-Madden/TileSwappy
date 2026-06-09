export interface EdgeHashes {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export class EdgeExtractionService {
  static extractEdgeHashes(
    canvas: HTMLCanvasElement
  ): EdgeHashes {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    const width = canvas.width;
    const height = canvas.height;

    return {
      top: this.hashPixels(
        ctx.getImageData(0, 0, width, 1).data
      ),

      bottom: this.hashPixels(
        ctx.getImageData(0, height - 1, width, 1).data
      ),

      left: this.hashPixels(
        ctx.getImageData(0, 0, 1, height).data
      ),

      right: this.hashPixels(
        ctx.getImageData(width - 1, 0, 1, height).data
      )
    };
  }

  private static hashPixels(data: Uint8ClampedArray): string {
    let hash = 0;

    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) | 0;
    }

    return Math.abs(hash).toString(16);
  }
}
