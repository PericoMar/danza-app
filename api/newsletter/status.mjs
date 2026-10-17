// api/newsletter/status.mjs
// Is this address subscribed?
//
// beehiiv answers and nothing else does. It is the only place that hears about
// the unsubscribes people do from the footer of an email, so a second opinion
// stored on our side could only ever be a staler, wronger one.
//
// When beehiiv can't answer, this says so with a 503 rather than guessing:
// "not subscribed" would show the sign-up form to someone already on the list.
// The client keeps whatever it last knew.

import {
  handledAsPreflightOrWrongMethod,
  isValidEmail,
  maskEmail,
  normalizeEmail,
} from "../../server/http.mjs";
import {
  SubscriptionState,
  findSubscription,
  isBeehiivConfigured,
  toSubscriptionState,
} from "../../server/beehiiv.mjs";

export default async function handler(req, res) {
  if (handledAsPreflightOrWrongMethod(req, res)) return;

  const email = normalizeEmail(req.body?.email);
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Local development without beehiiv credentials: nobody is subscribed.
  if (!isBeehiivConfigured()) {
    console.log("[Newsletter Status] beehiiv not configured");
    return res.status(200).json({ status: SubscriptionState.NOT_SUBSCRIBED });
  }

  try {
    const subscription = await findSubscription(email);
    const status = toSubscriptionState(subscription?.status);
    console.log("[Newsletter Status]", {
      email: maskEmail(email),
      beehiiv: subscription?.status ?? "not found",
      status,
    });
    return res.status(200).json({ status });
  } catch (err) {
    console.error("[Newsletter Status] beehiiv failed:", err.message);
    return res
      .status(503)
      .json({ error: "Could not reach the newsletter provider." });
  }
}
