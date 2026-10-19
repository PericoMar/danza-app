// Toasts: the short notices shown after an action ("Login successful.",
// "Wrong credentials."). What they mean and how long they stay.

/** What a toast is telling. Picks its colour and icon; callers never pass either. */
export const ToastTone = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type ToastTone = (typeof ToastTone)[keyof typeof ToastTone];

export const TOAST_DEFAULT_DURATION_MS = 3000;
/** For notices that read as a whole sentence rather than a couple of words. */
export const TOAST_LONG_DURATION_MS = 4000;

/** Gap between a toast and the bottom and side edges of the screen. */
export const TOAST_EDGE_OFFSET = 16;
