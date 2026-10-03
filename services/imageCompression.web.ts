import type { PickedImage } from '@/types/media';

export type CompressOptions = {
  /** Longest edge of the output image, in pixels. Larger images are scaled down. */
  maxSize?: number;
  /** WebP quality, 0..1. */
  quality?: number;
};

const DEFAULTS: Required<CompressOptions> = { maxSize: 512, quality: 0.9 };

// Formats we can't (or shouldn't) rasterise to WebP — keep the original file.
const SKIP_TYPES = new Set(['image/svg+xml', 'image/gif']);

/**
 * Downscales a picked image and re-encodes it as WebP using an offscreen canvas.
 * No native dependency on web. Falls back to the original file if anything goes
 * wrong or the result isn't actually smaller.
 */
export async function compressImage(
  image: PickedImage,
  options: CompressOptions = {}
): Promise<PickedImage> {
  const { maxSize, quality } = { ...DEFAULTS, ...options };
  const file = image as File;

  if (!file.type?.startsWith('image/') || SKIP_TYPES.has(file.type)) return image;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return image;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );

    // toBlob yields PNG when the browser can't encode WebP — bail in that case.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return image;

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return image;
  }
}
