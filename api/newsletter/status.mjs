// api/newsletter/status.mjs
// Is this address subscribed?
//
// beehiiv answers, because it is the only place that hears about the
// unsubscribes people do from the footer of an email. Our own table is the
// fallback for when beehiiv is unreachable, and for local development without
// beehiiv credentials.

import {
  handledAsPreflightOrWrongMethod,
  isValidEmail,
  maskEmail,
  normalizeEmail,
} from "../../server/http.mjs";
import {
  findSubscription,
  isBeehiivConfigured,
  isSubscribedStatus,
} from "../../server/beehiiv.mjs";
import {
  TABLES,
  createServiceRoleClient,
  missingSupabaseEnv,
} from "../../server/supabase.mjs";

const SUBSCRIBED = "subscribed";
const NOT_SUBSCRIBED = "not_subscribed";

export default async function handler(req, res) {
  if (handledAsPreflightOrWrongMethod(req, res)) return;

  const email = normalizeEmail(req.body?.email);
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  if (isBeehiivConfigured()) {
    try {
      const subscription = await findSubscription(email);
      console.log("[Newsletter Status] beehiiv:", {
        email: maskEmail(email),
        status: subscription?.status ?? "not found",
      });
      // No subscription at all is a real answer, not a reason to fall back.
      return res.status(200).json({
        status: isSubscribedStatus(subscription?.status)
          ? SUBSCRIBED
          : NOT_SUBSCRIBED,
      });
    } catch (err) {
      console.error("[Newsletter Status] beehiiv failed, using DB:", err.message);
    }
  }

  const missing = missingSupabaseEnv();
  if (missing.length > 0) {
    console.error("[Newsletter Status] Missing environment variables:", missing);
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const { data, error } = await createServiceRoleClient()
      .from(TABLES.NEWSLETTER_SUBSCRIPTIONS)
      .select("status")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[Newsletter Status] DB error:", error);
      return res.status(500).json({ error: "Failed to check subscription" });
    }

    return res.status(200).json({
      status: data?.status === SUBSCRIBED ? SUBSCRIBED : NOT_SUBSCRIBED,
    });
  } catch (err) {
    console.error("[Newsletter Status] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
