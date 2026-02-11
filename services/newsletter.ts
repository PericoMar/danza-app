import { Platform } from "react-native";
import { supabase } from "@/services/supabase";
import type { SubscriptionStatus } from "@/types/newsletter";

async function parseErrorResponse(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.message || `Server error (${response.status})`;
  } catch {
    // Response is not JSON, use text directly or fallback
    if (text && text.length < 200) {
      return text;
    }
    return `Server error (${response.status})`;
  }
}

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
  const url = `${API_BASE_URL}/api/newsletter`;

  console.log("[Newsletter] Subscribing:", { email, source, url });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
  } catch (networkError) {
    console.error("[Newsletter] Network error:", networkError);
    throw new Error("Network error. Please check your connection.");
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    console.error("[Newsletter] Subscribe failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
    });
    throw new Error(errorMessage);
  }

  console.log("[Newsletter] Subscribe success");
}

export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  const API_BASE_URL = getApiBaseUrl();
  const url = `${API_BASE_URL}/api/newsletter/unsubscribe`;

  console.log("[Newsletter] Unsubscribing:", { email, url });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (networkError) {
    console.error("[Newsletter] Network error:", networkError);
    throw new Error("Network error. Please check your connection.");
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    console.error("[Newsletter] Unsubscribe failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
    });
    throw new Error(errorMessage);
  }

  console.log("[Newsletter] Unsubscribe success");
}
