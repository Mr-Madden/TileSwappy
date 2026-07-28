// Shared "share this canvas as an image" flow -- native share sheet
// (with the image as a real file, so it drops straight into Messages/
// Instagram/etc. as a photo) when available, falling back to a direct
// download everywhere else (desktop browsers mostly lack File sharing
// support in navigator.share).
export type ShareImageResult = 'shared' | 'downloaded';

export async function shareOrDownloadImage(
  canvas: HTMLCanvasElement,
  filename: string,
  shareTitle: string
): Promise<ShareImageResult> {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  if (!blob) throw new Error('Could not generate image');

  const file = new File([blob], filename, { type: 'image/png' });
  const shareData = { files: [file], title: shareTitle };

  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
    return 'shared';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
