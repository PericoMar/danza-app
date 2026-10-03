// constants/features.ts
// Feature flags. Flip a flag here instead of deleting/commenting out code at
// the call site — keeps the feature reversible with a single-line change.

// Reviews (writing, reading on Company Insights, "My Reviews") are disabled
// for the App Store launch: the reviews table has no report/block/moderation
// flow yet, which Apple's User Generated Content guideline (1.2) requires
// for UGC visible to other users. Re-enable once that's in place.
export const REVIEWS_ENABLED = false;
