import { SubscriptionStatus } from "@/types/newsletter";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";

/** The provider's answer, narrowed to what the app knows how to render. */
function toStatus(value: unknown): SubscriptionStatus {
  return value === SubscriptionStatus.SUBSCRIBED ||
    value === SubscriptionStatus.VALIDATING
    ? value
    : SubscriptionStatus.NOT_SUBSCRIBED;
}

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

export async function checkNewsletterSubscription(
  email: string
): Promise<SubscriptionStatus> {
  const normalizedEmail = email.toLowerCase().trim();
  const API_BASE_URL = getApiBaseUrl();
  const url = `${API_BASE_URL}/api/newsletter/status`;

  console.log("[Newsletter] Checking subscription status for:", normalizedEmail);

  // Failures throw instead of answering "not_subscribed". React Query then keeps
  // the last value it knew, which beats showing the sign-up form to someone who
  // is already on the list just because the provider blinked.
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
  } catch (networkError) {
    console.error("[Newsletter] Network error checking status:", networkError);
    throw new Error("Network error. Please check your connection.");
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    console.error("[Newsletter] Status check failed:", response.status);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log("[Newsletter] Status from server:", data.status);

  return toStatus(data.status);
}

export type SubscribeResult = {
  /** True when the email was already an active subscriber before this call. */
  alreadySubscribed: boolean;
  /** Where the subscription stands now, so the caller needs no status check. */
  status: SubscriptionStatus;
};

export async function subscribeToNewsletter(
  email: string,
  source: string = "newsletter_page"
): Promise<SubscribeResult> {
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

  let alreadySubscribed = false;
  // An older server, or a body we can't read, means the subscribe went through
  // and we have nothing finer to say than "subscribed".
  let status: SubscriptionStatus = SubscriptionStatus.SUBSCRIBED;
  try {
    const data = await response.json();
    alreadySubscribed = data?.already_subscribed === true;
    if (data?.status) status = toStatus(data.status);
  } catch {
    // Body missing/invalid — treat as a fresh subscribe.
  }

  console.log("[Newsletter] Subscribe success", { alreadySubscribed, status });
  return { alreadySubscribed, status };
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
