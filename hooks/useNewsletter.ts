import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionStatus, SnackbarState } from "@/types/newsletter";
import {
  checkNewsletterSubscription,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "@/services/newsletter";
import { isValidEmail } from "@/utils/validation";

type UseNewsletterOptions = {
  userEmail?: string | null;
};

type UseNewsletterReturn = {
  status: SubscriptionStatus;
  /** True when the last subscribe attempt found the email was already on the list. */
  wasAlreadySubscribed: boolean;
  email: string;
  setEmail: (email: string) => void;
  isSubmitting: boolean;
  snackbar: SnackbarState;
  clearSnackbar: () => void;
  handleSubscribe: () => Promise<void>;
  handleUnsubscribe: () => Promise<void>;
};

export function useNewsletter({
  userEmail,
}: UseNewsletterOptions): UseNewsletterReturn {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [localStatus, setLocalStatus] = useState<SubscriptionStatus | null>(null);
  const [wasAlreadySubscribed, setWasAlreadySubscribed] = useState(false);
  const queryClient = useQueryClient();

  const clearSnackbar = useCallback(() => setSnackbar(null), []);

  // checkNewsletterSubscription throws when the provider can't answer, so React
  // Query keeps the last status it got instead of downgrading a subscriber to
  // "not subscribed" over a blip. The default only applies before the first
  // successful check.
  const { data: queryStatus = "not_subscribed" } = useQuery<SubscriptionStatus>({
    queryKey: ["newsletter-status", userEmail],
    queryFn: () => checkNewsletterSubscription(userEmail!),
    enabled: !!userEmail,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });

  // Local status takes precedence so anonymous forms (no userEmail, query disabled)
  // still reflect the result of a subscribe attempt.
  const status = localStatus ?? queryStatus;

  // Ref guard: blocks re-entry synchronously, before any state flush can disable
  // the button. Both onSubmitEditing and onPress point here.
  const inFlightRef = useRef(false);

  const handleSubscribe = useCallback(async () => {
    if (inFlightRef.current) return;

    const subscribeEmail = userEmail || email.trim();

    if (!subscribeEmail) {
      setSnackbar({
        message: "Please enter your email address",
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
      return;
    }

    if (!isValidEmail(subscribeEmail)) {
      setSnackbar({
        message: "Please enter a valid email address",
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
      return;
    }

    inFlightRef.current = true;
    setIsSubmitting(true);

    try {
      // Single request. The endpoint is idempotent and tells us whether the
      // email was already an active subscriber, so we can pick the copy without
      // a second round-trip.
      const { alreadySubscribed, status: newStatus } = await subscribeToNewsletter(
        subscribeEmail,
        "newsletter_page"
      );
      setWasAlreadySubscribed(alreadySubscribed);
      // Can be "validating": the success screen then carries a notice saying the
      // provider is still checking the address.
      setLocalStatus(newStatus);
      queryClient.setQueryData(
        ["newsletter-status", userEmail ?? subscribeEmail],
        newStatus
      );
      setSnackbar(
        alreadySubscribed
          ? {
              message: "You're already on the list — glad to have you!",
              color: "#F59E0B",
              iconName: "information-circle-outline",
            }
          : {
              message: "You're subscribed! Welcome aboard.",
              color: "#22C55E",
              iconName: "checkmark-circle-outline",
            }
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setSnackbar({
        message,
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [userEmail, email]);

  const handleUnsubscribe = useCallback(async () => {
    if (!userEmail || inFlightRef.current) return;

    inFlightRef.current = true;
    setIsSubmitting(true);

    try {
      await unsubscribeFromNewsletter(userEmail);
      setWasAlreadySubscribed(false);
      setLocalStatus("not_subscribed");
      queryClient.setQueryData(["newsletter-status", userEmail], "not_subscribed");
      setSnackbar({
        message: "You've been unsubscribed successfully.",
        color: "#22C55E",
        iconName: "checkmark-circle-outline",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setSnackbar({
        message,
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [userEmail]);

  return {
    status,
    wasAlreadySubscribed,
    email,
    setEmail,
    isSubmitting,
    snackbar,
    clearSnackbar,
    handleSubscribe,
    handleUnsubscribe,
  };
}
