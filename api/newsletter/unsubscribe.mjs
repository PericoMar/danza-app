// api/newsletter/unsubscribe.mjs
// Take an address off the newsletter.
//
// Only beehiiv is touched, because only beehiiv decides who gets an email. The
// consent log is not updated: an unsubscribe doesn't undo the fact that on a
// given day this person agreed, and that record is the point of keeping it.
//
// A failure here fails the request. Reporting success while beehiiv keeps
// mailing them is the one outcome this endpoint must never produce.

import {
  handledAsPreflightOrWrongMethod,
  isValidEmail,
  maskEmail,
  normalizeEmail,
} from "../../server/http.mjs";
import { isBeehiivConfigured, unsubscribe } from "../../server/beehiiv.mjs";

export default async function handler(req, res) {
  if (handledAsPreflightOrWrongMethod(req, res)) return;

  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (!isBeehiivConfigured()) {
      // Local development: there is no list to come off.
      console.log("[Newsletter Unsubscribe] beehiiv not configured");
      return res.status(200).json({ success: true });
    }

    try {
      const found = await unsubscribe(email);
      console.log("[Newsletter Unsubscribe]", {
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

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Newsletter Unsubscribe] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
