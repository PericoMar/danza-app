// api/newsletter/unsubscribe.mjs
// Take an address off the newsletter.
//
// beehiiv goes first and a failure there fails the request: marking someone
// unsubscribed in our table while beehiiv keeps mailing them is the one outcome
// this endpoint must never produce.

import {
  handledAsPreflightOrWrongMethod,
  isValidEmail,
  maskEmail,
  normalizeEmail,
} from "../../server/http.mjs";
import { isBeehiivConfigured, unsubscribe } from "../../server/beehiiv.mjs";
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
      console.error("[Newsletter Unsubscribe] Missing environment variables:", missing);
      return res.status(500).json({ error: "Server configuration error" });
    }

    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (isBeehiivConfigured()) {
      try {
        const found = await unsubscribe(email);
        console.log("[Newsletter Unsubscribe] beehiiv:", {
          email: maskEmail(email),
          // Not found means they were never there — nothing left to stop.
          found,
        });
      } catch (err) {
        console.error("[Newsletter Unsubscribe] beehiiv failed:", err.message);
        return res.status(502).json({
          error: "Could not reach the newsletter provider. Please try again.",
        });
      }
    } else {
      console.log("[Newsletter Unsubscribe] beehiiv not configured, DB only");
    }

    const { error: dbError } = await createServiceRoleClient()
      .from(TABLES.NEWSLETTER_SUBSCRIPTIONS)
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (dbError) {
      // They are already off the list in beehiiv, which is what they asked for.
      console.error("[Newsletter Unsubscribe] DB update failed:", dbError);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Newsletter Unsubscribe] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
