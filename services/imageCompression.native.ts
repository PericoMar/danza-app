import * as ImageManipulator from 'expo-image-manipulator';
import type { PickedImage, NativeImageAsset } from '@/types/media';

export type CompressOptions = {
  /** Longest edge of the output image, in pixels. Larger images are scaled down. */
  maxSize?: number;
  /** WebP quality, 0..1. */
  quality?: number;
};

const DEFAULTS: Required<CompressOptions> = { maxSize: 512, quality: 0.85 };

/**
 * Downscales a picked image and re-encodes it as WebP via expo-image-manipulator
 * (WebP is supported on both iOS and Android in v13). Falls back to the original
 * asset if manipulation fails.
 */
export async function compressImage(
  image: PickedImage,
  options: CompressOptions = {}
): Promise<PickedImage> {
  const { maxSize, quality } = { ...DEFAULTS, ...options };
  const asset = image as NativeImageAsset;
  if (!asset.uri) return image;

  // Only resize when we know the source is bigger than the target.
  const needsResize = !asset.width || asset.width > maxSize || (asset.height ?? 0) > maxSize;
  const actions: ImageManipulator.Action[] = needsResize
    ? [{ resize: asset.width && asset.height && asset.height > asset.width
        ? { height: maxSize }
        : { width: maxSize } }]
    : [];

  try {
    const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.WEBP,
    });
    const name = (asset.name ?? 'image').replace(/\.[^.]+$/, '') + '.webp';
    return { uri: result.uri, name, type: 'image/webp' };
  } catch {
    return image;
  }
}
