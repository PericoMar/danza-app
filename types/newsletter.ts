import { Ionicons } from "@expo/vector-icons";

export type SubscriptionStatus = "loading" | "subscribed" | "not_subscribed";

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
