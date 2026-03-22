import { Platform } from "react-native";
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
  const API_BASE_URL = getApiBaseUrl();
  const url = `${API_BASE_URL}/api/newsletter/status`;

  console.log("[Newsletter] Checking subscription status for:", normalizedEmail);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
  } catch (networkError) {
    console.error("[Newsletter] Network error checking status:", networkError);
    return "not_subscribed";
  }

  if (!response.ok) {
    console.error("[Newsletter] Status check failed:", response.status);
    return "not_subscribed";
  }

  const data = await response.json();
  console.log("[Newsletter] Status from server:", data.status);

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
