import type { ImageSourcePropType } from 'react-native';

// Photos bundled with the app. The Companies hero ring shows these until an
// admin uploads their own from /admin/settings, and again if those can't load.
// Ordered so neighbouring photos contrast (light / dark / warm / cool).
export const DEFAULT_HERO_RING_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/companies-ring/1.jpg'),
  require('@/assets/images/companies-ring/2.jpg'),
  require('@/assets/images/companies-ring/5.jpg'),
  require('@/assets/images/companies-ring/3.jpg'),
  require('@/assets/images/companies-ring/6.jpg'),
  require('@/assets/images/companies-ring/4.jpg'),
];

// Storage folder (inside STORAGE_BUCKETS.MEDIA) for uploaded ring photos.
export const HERO_RING_STORAGE_FOLDER = 'hero-ring';

// More than this and the photos pile up on top of each other.
export const HERO_RING_MAX_IMAGES = 8;
export const HERO_RING_RECOMMENDED_IMAGES = 6;

// Longest edge of an uploaded photo, in px. The front photo is at most ~210pt
// wide, so this keeps it sharp on 2× screens even when the photo isn't square
// and gets cropped to a circle.
export const HERO_RING_IMAGE_MAX_SIZE = 640;

// The list only changes when an admin edits it.
export const HERO_RING_STALE_TIME_MS = 10 * 60 * 1000;

// The ring waits for its photos to download before it appears, but no longer
// than this: after it, photos that are still loading fill in where they are.
export const HERO_RING_PRELOAD_TIMEOUT_MS = 3000;
