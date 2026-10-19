import {
  LOGIN_ROUTE,
  NEWSLETTER_ROUTE,
  REGISTER_ROUTE,
  RESET_PASSWORD_ROUTE,
} from "@/constants/routes";

// The audition-alerts popup: when it shows up, what it remembers, and which of
// the candidate designs real visitors get.

/** Every design the popup can take. Admins preview them all from /admin/settings. */
export const NewsletterPopupDesign = {
  CLASSIC: "classic",
  FLOATING_CARD: "floating_card",
  BOTTOM_SHEET: "bottom_sheet",
  PUSH_NOTIFICATION: "push_notification",
  EDITORIAL_SPLIT: "editorial_split",
  MIDNIGHT_CHROME: "midnight_chrome",
  INBOX_PREVIEW: "inbox_preview",
} as const;

export type NewsletterPopupDesign =
  (typeof NewsletterPopupDesign)[keyof typeof NewsletterPopupDesign];

/** The design real visitors get. Switching to another one is this line. */
export const ACTIVE_NEWSLETTER_POPUP_DESIGN: NewsletterPopupDesign =
  NewsletterPopupDesign.CLASSIC;

/**
 * How a design collects consent. "checkbox" asks for an explicit tick before
 * subscribing; "inline" says what subscribing means next to the button, the
 * way the /newsletter page and the home alerts section already do.
 */
export const NewsletterConsentMode = {
  CHECKBOX: "checkbox",
  INLINE: "inline",
} as const;

export type NewsletterConsentMode =
  (typeof NewsletterConsentMode)[keyof typeof NewsletterConsentMode];

/** Why the popup went away. Only a dismissal snoozes it. */
export const NewsletterPopupCloseReason = {
  DISMISSED: "dismissed",
  DONE: "done",
} as const;

export type NewsletterPopupCloseReason =
  (typeof NewsletterPopupCloseReason)[keyof typeof NewsletterPopupCloseReason];

// Pages where the popup should not appear. /newsletter is one of them: the page
// already is the form, and a popup over it asks twice.
export const NEWSLETTER_POPUP_EXCLUDED_PATHS = [
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  RESET_PASSWORD_ROUTE,
  NEWSLETTER_ROUTE,
] as const;

// What the endpoint records as the origin of the subscription.
export const NEWSLETTER_POPUP_SOURCE = "newsletter_modal";

export const NEWSLETTER_POPUP_STORAGE_KEYS = {
  /** Timestamp of the last "not now". */
  DISMISSED: "newsletter_dismissed",
  /** "true" once this device subscribed, or found the account already was. */
  SUBSCRIBED: "newsletter_subscribed",
} as const;

// The popup waits a random 5–10 s, so it never lands on top of the first read.
export const NEWSLETTER_POPUP_MIN_DELAY_MS = 5000;
export const NEWSLETTER_POPUP_MAX_DELAY_MS = 10000;

/** Days a dismissal keeps the popup away. */
export const NEWSLETTER_POPUP_SNOOZE_DAYS = 7;

// After subscribing the popup closes by itself. Guests get longer, to reach the
// "Create an account" button.
export const NEWSLETTER_POPUP_AUTO_CLOSE_MS = {
  SIGNED_IN: 2000,
  GUEST: 5000,
} as const;

/** How long a preview pretends to talk to the provider. */
export const NEWSLETTER_POPUP_PREVIEW_SUBMIT_MS = 700;

/** Upcoming auditions shown by the designs that preview the Sunday email. */
export const NEWSLETTER_POPUP_SAMPLE_AUDITIONS = 3;
