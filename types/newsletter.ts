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

// A row of `newsletter_subscriptions`: our record of consent. Whether the person
// actually receives the newsletter is beehiiv's answer, not this column's —
// see api/newsletter/status.mjs.
export type NewsletterSubscription = {
  email: string;
  status: "subscribed" | "unsubscribed";
  source?: string;
  beehiiv_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
