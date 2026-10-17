import { Ionicons } from "@expo/vector-icons";

// What the newsletter screens can show. `validating` is the window right after
// a signup while the provider checks the address: the person did subscribe, but
// nothing is guaranteed to arrive yet, so the UI says so rather than picking a
// side. Mirrors SubscriptionState in server/beehiiv.mjs.
export const SubscriptionStatus = {
  LOADING: "loading",
  SUBSCRIBED: "subscribed",
  VALIDATING: "validating",
  NOT_SUBSCRIBED: "not_subscribed",
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

/** Both states where the person is on the list, whatever the provider still has to check. */
export function hasSubscribed(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.SUBSCRIBED ||
    status === SubscriptionStatus.VALIDATING
  );
}

export type SnackbarState = {
  message: string;
  color?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
} | null;

// A row of `newsletter_consents`: one act of subscribing through our own forms,
// kept as the evidence of consent that beehiiv doesn't store. Append-only, and
// never the answer to "is this person subscribed" — that is beehiiv's, via
// api/newsletter/status.mjs.
export type NewsletterConsent = {
  email: string;
  source: "newsletter_page" | "newsletter_modal" | "unknown";
  consented_at: string;
  consent_ip?: string | null;
  consent_user_agent?: string | null;
  beehiiv_subscription_id?: string | null;
  created_at?: string;
};
