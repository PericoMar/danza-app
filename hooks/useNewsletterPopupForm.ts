import { useCallback, useRef, useState } from "react";
import { subscribeToNewsletter } from "@/services/newsletter";
import { SubscriptionStatus } from "@/types/newsletter";
import { isValidEmail, suggestEmailFix } from "@/utils/validation";
import {
  NEWSLETTER_POPUP_PREVIEW_SUBMIT_MS,
  NEWSLETTER_POPUP_SOURCE,
  NewsletterConsentMode,
} from "@/constants/newsletterPopup";

type UseNewsletterPopupFormOptions = {
  /** The signed-in address: shown read-only and subscribed as is. Null for guests. */
  lockedEmail: string | null;
  consentMode: NewsletterConsentMode;
  /**
   * Runs every check but never reaches the provider, so an admin can walk a
   * design through to its success state without subscribing anyone.
   */
  isSimulated?: boolean;
  /** After a real subscription went through. */
  onSubscribed?: () => void;
};

/** Everything a popup design needs to render its form. Same shape for every design. */
export type NewsletterPopupForm = {
  lockedEmail: string | null;
  consentMode: NewsletterConsentMode;
  email: string;
  setEmail: (value: string) => void;
  hasConsent: boolean;
  toggleConsent: () => void;
  /** From the Privacy Policy modal's "Accept". */
  acceptConsent: () => void;
  error: string | null;
  /** A corrected address when the typed one looks like a slip ("…@gmail.con"). */
  emailSuggestion: string | null;
  acceptEmailSuggestion: () => void;
  isSubmitting: boolean;
  isSubscribed: boolean;
  /** Subscribed, but the provider is still checking the address. */
  isValidating: boolean;
  /** The address that was (or will be) subscribed. */
  subscribedEmail: string;
  submit: () => void;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Form state and submission for the audition-alerts popup, whatever it looks like. */
export function useNewsletterPopupForm({
  lockedEmail,
  consentMode,
  isSimulated = false,
  onSubscribed,
}: UseNewsletterPopupFormOptions): NewsletterPopupForm {
  const [email, setEmailState] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  // Blocks a second tap synchronously, before the disabled state renders.
  const inFlightRef = useRef(false);

  const isGuest = !lockedEmail;

  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    setEmailSuggestion(null);
  }, []);

  const toggleConsent = useCallback(() => {
    if (!inFlightRef.current) setHasConsent((value) => !value);
  }, []);

  const acceptConsent = useCallback(() => setHasConsent(true), []);

  const subscribe = useCallback(
    async (subscribeEmail: string) => {
      if (inFlightRef.current) return;
      setError(null);

      if (isGuest && !subscribeEmail) {
        setError("Please enter your email address");
        return;
      }

      if (isGuest && !isValidEmail(subscribeEmail)) {
        setError("Please enter a valid email address");
        return;
      }

      if (consentMode === NewsletterConsentMode.CHECKBOX && !hasConsent) {
        setError("Please accept the terms to continue");
        return;
      }

      // A typo in the domain is not an error for the provider: it accepts the
      // address and the email never arrives. One tap beats a dead subscriber.
      const suggestion = isGuest ? suggestEmailFix(subscribeEmail) : null;
      if (suggestion) {
        setEmailSuggestion(suggestion);
        return;
      }

      inFlightRef.current = true;
      setIsSubmitting(true);

      try {
        if (isSimulated) {
          await wait(NEWSLETTER_POPUP_PREVIEW_SUBMIT_MS);
        } else {
          // Same call as every other subscribe path, so the error handling and
          // the shape of the answer can't drift from the newsletter page's.
          const { status } = await subscribeToNewsletter(
            subscribeEmail,
            NEWSLETTER_POPUP_SOURCE,
          );
          // "validating" means the provider is still checking the address, and
          // the success copy says so.
          setIsValidating(status === SubscriptionStatus.VALIDATING);
          onSubscribed?.();
        }
        setIsSubscribed(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [consentMode, hasConsent, isGuest, isSimulated, onSubscribed],
  );

  const subscribedEmail = lockedEmail ?? email.trim();

  const submit = useCallback(() => {
    subscribe(subscribedEmail);
  }, [subscribe, subscribedEmail]);

  const acceptEmailSuggestion = useCallback(() => {
    if (!emailSuggestion) return;
    setEmailState(emailSuggestion);
    setEmailSuggestion(null);
    subscribe(emailSuggestion);
  }, [emailSuggestion, subscribe]);

  return {
    lockedEmail,
    consentMode,
    email,
    setEmail,
    hasConsent,
    toggleConsent,
    acceptConsent,
    error,
    emailSuggestion,
    acceptEmailSuggestion,
    isSubmitting,
    isSubscribed,
    isValidating,
    subscribedEmail,
    submit,
  };
}
