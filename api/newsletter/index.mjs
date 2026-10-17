// api/newsletter/index.mjs
// Subscribe an address to the newsletter.
//
// The subscription lives in beehiiv and nowhere else. Our database only gets
// the consent record — when, from which form, from which IP — which beehiiv
// does not store and which we have to be able to produce.
//
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
  SubscriptionState,
  createSubscription,
  findSubscription,
  isBeehiivConfigured,
  isSubscribedStatus,
  toSubscriptionState,
} from "../../server/beehiiv.mjs";
import { NewsletterSource, recordConsent } from "../../server/consent.mjs";
import {
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

    const { email: rawEmail, source = NewsletterSource.MODAL } = req.body || {};
    const email = normalizeEmail(rawEmail);
    console.log("[Newsletter] Subscribe:", { email: maskEmail(email), source });

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Was this address already on the list? It only decides between "welcome
    // aboard" and "you're already on the list", so when beehiiv can't say, the
    // friendlier of the two is a fine guess.
    const alreadySubscribed = await wasAlreadySubscribed(email);

    let subscriptionId = null;
    // Without beehiiv credentials there is nothing to validate, so local
    // development behaves as it always has: the form reports success.
    let state = SubscriptionState.SUBSCRIBED;

    if (isBeehiivConfigured()) {
      try {
        const subscription = await createSubscription(email, { source });
        subscriptionId = subscription?.id ?? null;
        state = toSubscriptionState(subscription?.status);

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
      console.log("[Newsletter] beehiiv not configured, recording consent only");
    }

    const { error: consentError } = await recordConsent(
      createServiceRoleClient(),
      {
        email,
        source,
        // Read from the request rather than trusted from the body.
        ip:
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        userAgent: req.headers["user-agent"] || null,
        beehiivSubscriptionId: subscriptionId,
      }
    );

    if (consentError) {
      // They are subscribed in beehiiv, so the thing they asked for happened.
      // Only our own evidence of it is missing, which they can't fix by retrying.
      console.error("[Newsletter] Consent record failed to save:", consentError);
    }

    return res.status(200).json({
      success: true,
      already_subscribed: alreadySubscribed,
      // Lets the client show the right screen without a second round trip,
      // including the "still being checked" notice when beehiiv says so.
      status: state,
      beehiiv_subscription_id: subscriptionId,
    });
  } catch (err) {
    console.error("[Newsletter] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** True when beehiiv already had the address active before this request. */
async function wasAlreadySubscribed(email) {
  if (!isBeehiivConfigured()) return false;

  try {
    const subscription = await findSubscription(email);
    return isSubscribedStatus(subscription?.status);
  } catch (err) {
    if (!(err instanceof BeehiivError)) throw err;
    // There is no second place to ask any more, and this only picks the copy.
    console.error("[Newsletter] beehiiv lookup failed:", err.message);
    return false;
  }
}
