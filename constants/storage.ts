// Supabase Storage bucket names, shared across every upload/download/delete call site.
export const STORAGE_BUCKETS = {
  MEDIA: 'media',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// Cache-Control max-age (seconds) for uploads whose path is never reused, such as
// the ones built by `buildImagePath`: browsers and the CDN can keep them for a year.
export const IMMUTABLE_CACHE_CONTROL = '31536000';
