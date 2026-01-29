import { Platform } from "react-native";
import { supabase } from "@/services/supabase";
import type { SubscriptionStatus } from "@/types/newsletter";

function getApiBaseUrl(): string {
  const DEV_BASE =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";

  return __DEV__ ? DEV_BASE : (process.env.EXPO_PUBLIC_API_BASE ?? "");
}

export async function checkNewsletterSubscription(
  email: string
): Promise<SubscriptionStatus> {
  const normalizedEmail = email.toLowerCase().trim();

  console.log("[Newsletter] Checking subscription for:", normalizedEmail);

  const { data, error } = await supabase
    .from("newsletter_subscriptions")
    .select("*") // Select all fields for debugging
    .eq("email", normalizedEmail)
    .maybeSingle();

  console.log("[Newsletter] Query result:", { data, error });

  if (error) {
    console.error("[Newsletter] Subscription check error:", error);
    return "not_subscribed";
  }

  if (!data) {
    console.log("[Newsletter] No subscription found for email");
    return "not_subscribed";
  }

  console.log("[Newsletter] Found subscription with status:", data.status);

  return data.status === "subscribed" ? "subscribed" : "not_subscribed";
}

export async function subscribeToNewsletter(
  email: string,
  source: string = "newsletter_page"
): Promise<void> {
  const API_BASE_URL = getApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      source,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Subscription failed");
  }
}

export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  const API_BASE_URL = getApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}/api/newsletter/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Unsubscribe failed");
  }
}
