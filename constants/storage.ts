// Supabase Storage bucket names, shared across every upload/download/delete call site.
export const STORAGE_BUCKETS = {
  MEDIA: 'media',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// Cache-Control max-age (seconds) for uploads whose path is never reused, such as
// the ones built by `buildImagePath`: browsers and the CDN can keep them for a year.
export const IMMUTABLE_CACHE_CONTROL = '31536000';

// Keys of things we keep on the device (AsyncStorage on native, localStorage on
// web). Centralised so a rename is one edit and two screens can never disagree.
export const LOCAL_STORAGE_KEYS = {
  // What a professional chose in the onboarding before they had an account.
  // Has to outlive the provider remount that a new session causes — and the
  // app reload that confirming an email by link causes.
  PENDING_RESOURCE_DRAFT: 'danza.resources.pendingDraft',
} as const;
