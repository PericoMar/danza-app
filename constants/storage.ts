// Supabase Storage bucket names, shared across every upload/download/delete call site.
export const STORAGE_BUCKETS = {
  MEDIA: 'media',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
