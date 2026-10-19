import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkNewsletterSubscription } from "@/services/newsletter";
import { hasSubscribed } from "@/types/newsletter";
import {
  NEWSLETTER_POPUP_MAX_DELAY_MS,
  NEWSLETTER_POPUP_MIN_DELAY_MS,
  NEWSLETTER_POPUP_SNOOZE_DAYS,
  NEWSLETTER_POPUP_STORAGE_KEYS,
  NewsletterPopupCloseReason,
} from "@/constants/newsletterPopup";

const DAY_MS = 24 * 60 * 60 * 1000;

type UseNewsletterPopupScheduleOptions = {
  /** False while auth loads or on a page the popup must not cover. */
  isEnabled: boolean;
  /** The signed-in address, checked against the provider for cross-device signups. */
  userEmail: string | null;
};

/**
 * When the audition-alerts popup opens, and what it remembers once it closes:
 * a subscription keeps it away for good, a dismissal for a week.
 */
export function useNewsletterPopupSchedule({
  isEnabled,
  userEmail,
}: UseNewsletterPopupScheduleOptions) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkAndSchedule = async () => {
      try {
        const subscribed = await AsyncStorage.getItem(NEWSLETTER_POPUP_STORAGE_KEYS.SUBSCRIBED);
        if (subscribed === "true") return;

        // If logged in, verify against the server (covers cross-device subscriptions)
        if (userEmail) {
          try {
            const serverStatus = await checkNewsletterSubscription(userEmail);
            // "validating" counts: they subscribed, don't ask them again.
            if (hasSubscribed(serverStatus)) {
              await AsyncStorage.setItem(NEWSLETTER_POPUP_STORAGE_KEYS.SUBSCRIBED, "true");
              return;
            }
          } catch {
            // Provider unreachable. Fall through to the usual dismissal rules
            // rather than skipping them, which would hide the popup for everyone.
          }
        }

        const dismissed = await AsyncStorage.getItem(NEWSLETTER_POPUP_STORAGE_KEYS.DISMISSED);
        if (dismissed) {
          const dismissedAt = parseInt(dismissed, 10);
          if (Date.now() - dismissedAt < NEWSLETTER_POPUP_SNOOZE_DAYS * DAY_MS) return;
        }

        const delay =
          NEWSLETTER_POPUP_MIN_DELAY_MS +
          Math.random() * (NEWSLETTER_POPUP_MAX_DELAY_MS - NEWSLETTER_POPUP_MIN_DELAY_MS);
        timeoutId = setTimeout(() => setIsOpen(true), delay);
      } catch (e) {
        console.warn("Failed to check newsletter state", e);
      }
    };

    checkAndSchedule();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEnabled, userEmail]);

  const close = useCallback(async (reason: NewsletterPopupCloseReason) => {
    setIsOpen(false);
    if (reason !== NewsletterPopupCloseReason.DISMISSED) return;
    try {
      await AsyncStorage.setItem(NEWSLETTER_POPUP_STORAGE_KEYS.DISMISSED, Date.now().toString());
    } catch (e) {
      console.warn("Failed to save newsletter dismissed state", e);
    }
  }, []);

  const markSubscribed = useCallback(async () => {
    try {
      await AsyncStorage.setItem(NEWSLETTER_POPUP_STORAGE_KEYS.SUBSCRIBED, "true");
    } catch (e) {
      console.warn("Failed to save newsletter subscribed state", e);
    }
  }, []);

  return { isOpen, close, markSubscribed };
}
