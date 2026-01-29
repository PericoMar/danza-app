import { Ionicons } from "@expo/vector-icons";

export type SubscriptionStatus = "loading" | "subscribed" | "not_subscribed";

export type SnackbarState = {
  message: string;
  color?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
} | null;

export type NewsletterSubscription = {
  email: string;
  status: "subscribed" | "unsubscribed";
  source?: string;
  brevo_contact_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
