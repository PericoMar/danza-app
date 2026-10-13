// A photo uploaded by an admin for the Companies hero ring (`hero_ring_images`).
export interface HeroRingImage {
  id: string;
  image_url: string;
  /** Order around the ring, 0 first. */
  position: number;
}

// Editing actions on the ring, so the admin screen can say which one failed.
export const HeroRingAction = {
  ADD: 'add',
  REMOVE: 'remove',
  REORDER: 'reorder',
} as const;
export type HeroRingAction = (typeof HeroRingAction)[keyof typeof HeroRingAction];
