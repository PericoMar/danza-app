import type { ImageSourcePropType } from 'react-native';
import { DEFAULT_HERO_RING_IMAGES } from '@/constants/heroRing';
import type { HeroRingImage } from '@/types/heroRing';

type HeroRingState = {
  /** The configured photos; undefined while the list is loading. */
  images: HeroRingImage[] | undefined;
  /** The list couldn't be fetched. */
  failed: boolean;
  /** The configured photos have been downloaded (or the preload timed out). */
  preloaded: boolean;
};

/**
 * What the hero ring should show: the configured photos once they're ready,
 * the bundled ones when none are configured or the list can't be fetched, and
 * null while still waiting, so the ring appears once, with its final photos,
 * instead of swapping them after it has bloomed in.
 */
export function resolveHeroRingSources({ images, failed, preloaded }: HeroRingState): ImageSourcePropType[] | null {
  if (failed) return DEFAULT_HERO_RING_IMAGES;
  if (!images) return null;
  if (images.length === 0) return DEFAULT_HERO_RING_IMAGES;
  if (!preloaded) return null;
  return images.map((image) => ({ uri: image.image_url }));
}
