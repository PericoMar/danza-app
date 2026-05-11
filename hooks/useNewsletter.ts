import { useState, useCallback } from "react";
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
  const queryClient = useQueryClient();

  const clearSnackbar = useCallback(() => setSnackbar(null), []);

  const { data: status = "not_subscribed" } = useQuery<SubscriptionStatus>({
    queryKey: ["newsletter-status", userEmail],
    queryFn: () => checkNewsletterSubscription(userEmail!),
    enabled: !!userEmail,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });

  const handleSubscribe = useCallback(async () => {
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

    setIsSubmitting(true);

    try {
      await subscribeToNewsletter(subscribeEmail, "newsletter_page");
      queryClient.setQueryData(["newsletter-status", userEmail ?? subscribeEmail], "subscribed");
      setSnackbar({
        message: "You're subscribed! Welcome aboard.",
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
      setIsSubmitting(false);
    }
  }, [userEmail, email]);

  const handleUnsubscribe = useCallback(async () => {
    if (!userEmail) return;

    setIsSubmitting(true);

    try {
      await unsubscribeFromNewsletter(userEmail);
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
      setIsSubmitting(false);
    }
  }, [userEmail]);

  return {
    status,
    email,
    setEmail,
    isSubmitting,
    snackbar,
    clearSnackbar,
    handleSubscribe,
    handleUnsubscribe,
  };
}
