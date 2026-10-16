// api/newsletter/index.mjs
// Subscribe an address to the newsletter.
//
// beehiiv is where the subscription really lives; our table keeps the record of
// consent (when, from which page, which IP) that beehiiv doesn't store for us.
// If beehiiv refuses the subscription the request fails: telling someone they
// are subscribed and then answering "not subscribed" on the next status check
// is worse than an error they can retry.

import {
  handledAsPreflightOrWrongMethod,
  isValidEmail,
  maskEmail,
  normalizeEmail,
} from "../../server/http.mjs";
import {
  BeehiivError,
  BeehiivStatus,
  createSubscription,
  findSubscription,
  isBeehiivConfigured,
  isSubscribedStatus,
} from "../../server/beehiiv.mjs";
import {
  TABLES,
  createServiceRoleClient,
  missingSupabaseEnv,
} from "../../server/supabase.mjs";

export default async function handler(req, res) {
  if (handledAsPreflightOrWrongMethod(req, res)) return;

  try {
    const missing = missingSupabaseEnv();
    if (missing.length > 0) {
      console.error("[Newsletter] Missing environment variables:", missing);
      return res.status(500).json({ error: "Server configuration error" });
    }

    const { email: rawEmail, source = "newsletter_modal" } = req.body || {};
    const email = normalizeEmail(rawEmail);
    console.log("[Newsletter] Subscribe:", { email: maskEmail(email), source });

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const supabase = createServiceRoleClient();

    // Consent metadata, read from the request rather than trusted from the body.
    const consentIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    const consentUserAgent = req.headers["user-agent"] || null;

    // Was this address already on the list? It decides between "welcome aboard"
    // and "you're already on the list", so the client needs no second request.
    const alreadySubscribed = await wasAlreadySubscribed(supabase, email);

    let subscriptionId = null;
    if (isBeehiivConfigured()) {
      try {
        const subscription = await createSubscription(email, { source });
        subscriptionId = subscription?.id ?? null;

        if (subscription?.status === BeehiivStatus.INVALID) {
          console.warn("[Newsletter] beehiiv rejected the address as invalid");
          return res
            .status(400)
            .json({ error: "That email address was rejected. Please check it." });
        }
        console.log("[Newsletter] beehiiv subscription:", {
          id: subscriptionId,
          status: subscription?.status,
        });
      } catch (err) {
        console.error("[Newsletter] beehiiv subscribe failed:", err.message);
        return res.status(502).json({
          error: "Could not reach the newsletter provider. Please try again.",
        });
      }
    } else {
      // Local development without beehiiv credentials: record consent only.
      console.log("[Newsletter] beehiiv not configured, saving locally only");
    }

    const { error: dbError } = await supabase
      .from(TABLES.NEWSLETTER_SUBSCRIPTIONS)
      .upsert(
        {
          email,
          status: "subscribed",
          source,
          beehiiv_subscription_id: subscriptionId,
          consent_ip: consentIp,
          consent_user_agent: consentUserAgent,
          consent_at: new Date().toISOString(),
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (dbError) {
      // The person is on the list in beehiiv, so the subscription itself worked;
      // only our consent record is missing. Don't tell them to retry.
      console.error("[Newsletter] Consent record failed to save:", dbError);
    }

    return res.status(200).json({
      success: true,
      already_subscribed: alreadySubscribed,
      beehiiv_subscription_id: subscriptionId,
    });
  } catch (err) {
    console.error("[Newsletter] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * True when the address was an active subscriber before this request. Asks
 * beehiiv, which is the source of truth, and falls back to our own table when
 * beehiiv can't answer — getting this wrong only picks the wrong wording.
 */
async function wasAlreadySubscribed(supabase, email) {
  if (isBeehiivConfigured()) {
    try {
      const subscription = await findSubscription(email);
      return isSubscribedStatus(subscription?.status);
    } catch (err) {
      if (!(err instanceof BeehiivError)) throw err;
      console.error("[Newsletter] beehiiv lookup failed, using DB:", err.message);
    }
  }

  const { data, error } = await supabase
    .from(TABLES.NEWSLETTER_SUBSCRIPTIONS)
    .select("status")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[Newsletter] Existing-check error:", error);
    return false;
  }
  return data?.status === "subscribed";
}
