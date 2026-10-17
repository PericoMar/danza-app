// server/consent.mjs
// The newsletter consent log: an append-only record of each sign-up made
// through our own forms.
//
// It exists because beehiiv doesn't keep it. beehiiv stores the subscriber and
// when they were created; it does not store the IP, the user agent, or which
// form they used — the evidence that Article 7(1) GDPR asks us to be able to
// produce, and that the privacy policy promises.
//
// It is never read to decide whether someone is subscribed. That question has
// exactly one answer and it lives in beehiiv (see server/beehiiv.mjs), which is
// why nothing here can drift.

import { TABLES } from "./supabase.mjs";

// Must match the `newsletter_source` enum in the database. A form that isn't
// one of these needs a migration, not a new string.
export const NewsletterSource = {
  PAGE: "newsletter_page",
  MODAL: "newsletter_modal",
  UNKNOWN: "unknown",
};

const KNOWN_SOURCES = new Set([
  NewsletterSource.PAGE,
  NewsletterSource.MODAL,
]);

/**
 * `source` arrives in the request body, so it can be anything. Recording
 * "unknown" is better than both rejecting a real sign-up over a provenance
 * field and quietly filing it under the wrong form.
 */
export function normalizeSource(value) {
  return KNOWN_SOURCES.has(value) ? value : NewsletterSource.UNKNOWN;
}

/**
 * Appends one consent. Returns the error instead of throwing: the subscription
 * itself already succeeded in beehiiv, so a failure here must not turn into a
 * "try again" the caller would act on. It is logged and surfaced upwards.
 */
export async function recordConsent(supabase, {
  email,
  source,
  ip,
  userAgent,
  beehiivSubscriptionId,
}) {
  const { error } = await supabase.from(TABLES.NEWSLETTER_CONSENTS).insert({
    email,
    source: normalizeSource(source),
    consented_at: new Date().toISOString(),
    consent_ip: ip,
    consent_user_agent: userAgent,
    beehiiv_subscription_id: beehiivSubscriptionId,
  });

  return { error };
}
