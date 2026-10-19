import type { ComponentType } from "react";
import type { NewsletterPopupForm } from "@/hooks/useNewsletterPopupForm";
import type {
  NewsletterConsentMode,
  NewsletterPopupCloseReason,
} from "@/constants/newsletterPopup";

/**
 * The one prop contract every popup design takes, so any design can stand in
 * for any other: the production popup and the admin preview render whichever
 * is chosen without knowing which it is.
 */
export type NewsletterPopupViewProps = {
  form: NewsletterPopupForm;
  /** Called after the design's own exit animation. */
  onClose: (reason: NewsletterPopupCloseReason) => void;
  onOpenPrivacyPolicy: () => void;
  /** Guests, once subscribed: open sign-up with the address filled in. The design closes itself. */
  onCreateAccount: () => void;
  /** Close by itself this long after subscribing; null stays open. */
  autoCloseAfterSuccessMs: number | null;
};

export type NewsletterPopupDesignEntry = {
  View: ComponentType<NewsletterPopupViewProps>;
  consentMode: NewsletterConsentMode;
};

/** Light parts on white surfaces, dark parts on near-black ones. */
export type PopupTone = "light" | "dark";
