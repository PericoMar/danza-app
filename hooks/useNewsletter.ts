import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionStatus } from "@/types/newsletter";
import {
  checkNewsletterSubscription,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "@/services/newsletter";
import { isValidEmail, suggestEmailFix } from "@/utils/validation";
import { TOAST_LONG_DURATION_MS, ToastTone } from "@/constants/toast";
import { useToast, type ToastRequest } from "@/providers/ToastProvider";

type UseNewsletterOptions = {
  userEmail?: string | null;
};

type UseNewsletterReturn = {
  status: SubscriptionStatus;
  /** True when the last subscribe attempt found the email was already on the list. */
  wasAlreadySubscribed: boolean;
  email: string;
  setEmail: (email: string) => void;
  /**
   * The corrected address when the one typed looks like a slip ("…@gmail.con").
   * Set instead of subscribing; `acceptEmailSuggestion` takes it and goes on.
   */
  emailSuggestion: string | null;
  acceptEmailSuggestion: () => void;
  isSubmitting: boolean;
  handleSubscribe: () => Promise<void>;
  handleUnsubscribe: () => Promise<void>;
};

export function useNewsletter({
  userEmail,
}: UseNewsletterOptions): UseNewsletterReturn {
  const [email, setEmailState] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState<SubscriptionStatus | null>(null);
  const [wasAlreadySubscribed, setWasAlreadySubscribed] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // The newsletter's notices are whole sentences, so they stay a beat longer.
  const notify = useCallback(
    (toast: ToastRequest) => showToast({ duration: TOAST_LONG_DURATION_MS, ...toast }),
    [showToast],
  );

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

  // Editar la dirección retira la sugerencia: ya no se refiere a lo que hay.
  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    setEmailSuggestion(null);
  }, []);

  // `isTyped` distingue la dirección que el usuario acaba de escribir de la que
  // viene de su cuenta: la segunda se muestra bloqueada, así que ofrecerle una
  // corrección sería ofrecerle algo que no puede aceptar.
  const subscribe = useCallback(async (subscribeEmail: string, isTyped: boolean) => {
    if (inFlightRef.current) return;

    if (!subscribeEmail) {
      notify({
        message: "Please enter your email address",
        tone: ToastTone.ERROR,
      });
      return;
    }

    if (!isValidEmail(subscribeEmail)) {
      notify({
        message: "Please enter a valid email address",
        tone: ToastTone.ERROR,
      });
      return;
    }

    // Una dirección con un desliz en el dominio no da error: se acepta, no
    // llega nunca y se queda en el proveedor ensuciando la lista. Mejor
    // preguntar aquí, que es un toque, que mandarla.
    const suggestion = isTyped ? suggestEmailFix(subscribeEmail) : null;
    if (suggestion) {
      setEmailSuggestion(suggestion);
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
      notify(
        alreadySubscribed
          ? {
              message: "You're already on the list — glad to have you!",
              tone: ToastTone.INFO,
            }
          : {
              message: "You're subscribed! Welcome aboard.",
              tone: ToastTone.SUCCESS,
            }
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      notify({
        message,
        tone: ToastTone.ERROR,
      });
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [userEmail, queryClient, notify]);

  const handleSubscribe = useCallback(
    () => (userEmail ? subscribe(userEmail, false) : subscribe(email.trim(), true)),
    [subscribe, userEmail, email],
  );

  const acceptEmailSuggestion = useCallback(() => {
    if (!emailSuggestion) return;
    setEmailState(emailSuggestion);
    setEmailSuggestion(null);
    subscribe(emailSuggestion, true);
  }, [emailSuggestion, subscribe]);

  const handleUnsubscribe = useCallback(async () => {
    if (!userEmail || inFlightRef.current) return;

    inFlightRef.current = true;
    setIsSubmitting(true);

    try {
      await unsubscribeFromNewsletter(userEmail);
      setWasAlreadySubscribed(false);
      setLocalStatus("not_subscribed");
      queryClient.setQueryData(["newsletter-status", userEmail], "not_subscribed");
      notify({
        message: "You've been unsubscribed successfully.",
        tone: ToastTone.SUCCESS,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      notify({
        message,
        tone: ToastTone.ERROR,
      });
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [userEmail, queryClient, notify]);

  return {
    status,
    wasAlreadySubscribed,
    email,
    setEmail,
    emailSuggestion,
    acceptEmailSuggestion,
    isSubmitting,
    handleSubscribe,
    handleUnsubscribe,
  };
}
