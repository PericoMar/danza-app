// server/beehiiv.mjs
// beehiiv API client for the newsletter, and the only module that knows beehiiv
// exists. Swapping the provider again means rewriting this file and nothing else:
// the three functions under /api/newsletter speak in subscriptions, not in HTTP.
//
// beehiiv is the source of truth for who is subscribed. Most people unsubscribe
// from the footer of an email, and that never reaches our own endpoints — our
// table would quietly keep saying they are on the list.
//
// Docs: https://developers.beehiiv.com/api-reference/subscriptions

const API_BASE = "https://api.beehiiv.com/v2";

// Where a subscription can be in beehiiv. Only `active` means "on the list":
// `pending` is a double opt-in nobody confirmed, `inactive` is an unsubscribe,
// and the rest are states that need a human on the beehiiv side.
export const BeehiivStatus = {
  VALIDATING: "validating",
  INVALID: "invalid",
  PENDING: "pending",
  ACTIVE: "active",
  INACTIVE: "inactive",
  NEEDS_ATTENTION: "needs_attention",
  PAUSED: "paused",
};

/** Our one question about a beehiiv status: does this person get the newsletter? */
export function isSubscribedStatus(status) {
  return status === BeehiivStatus.ACTIVE;
}

// What the app shows, as opposed to what beehiiv tracks internally. `validating`
// is beehiiv checking the address in the seconds-to-minutes after a signup: the
// person did subscribe, but nothing is guaranteed to arrive until it resolves,
// so the UI says so instead of claiming either answer.
export const SubscriptionState = {
  SUBSCRIBED: "subscribed",
  VALIDATING: "validating",
  NOT_SUBSCRIBED: "not_subscribed",
};

/**
 * Collapses beehiiv's seven states into the three the app can render. Anything
 * that isn't active or validating — inactive, invalid, paused, needs_attention,
 * an unconfirmed pending, or no subscription at all — is not subscribed.
 */
export function toSubscriptionState(status) {
  if (status === BeehiivStatus.ACTIVE) return SubscriptionState.SUBSCRIBED;
  if (status === BeehiivStatus.VALIDATING) return SubscriptionState.VALIDATING;
  return SubscriptionState.NOT_SUBSCRIBED;
}

export function isBeehiivConfigured() {
  return Boolean(
    process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUBLICATION_ID
  );
}

export class BeehiivError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = "BeehiivError";
    this.status = status;
    this.cause = cause;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const url = `${API_BASE}/publications/${process.env.BEEHIIV_PUBLICATION_ID}${path}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    throw new BeehiivError(`beehiiv is unreachable: ${err.message}`, { cause: err });
  }

  // 404 is an answer, not a failure: the address simply isn't in the publication.
  if (response.status === 404) return { found: false, subscription: null };

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new BeehiivError(
      `beehiiv responded ${response.status}: ${detail.slice(0, 300)}`,
      { status: response.status }
    );
  }

  const payload = await response.json().catch(() => ({}));
  // Every subscription endpoint wraps its result in `data`; be lenient anyway.
  return { found: true, subscription: toSubscription(payload?.data ?? payload) };
}

function toSubscription(data) {
  if (!data?.id) return null;
  return { id: String(data.id), status: data.status ?? null };
}

function subscriptionPath(email) {
  return `/subscriptions/by_email/${encodeURIComponent(email)}`;
}

/**
 * The subscription for an address, or null when beehiiv has never seen it.
 * Throws BeehiivError if beehiiv itself is down or rejects the request.
 */
export async function findSubscription(email) {
  const { subscription } = await request(subscriptionPath(email));
  return subscription;
}

/**
 * Puts an address on the list and returns its subscription.
 *
 * `reactivate_existing` matters: without it beehiiv leaves someone who had
 * unsubscribed as `inactive`, so resubscribing from the site would silently do
 * nothing. `double_opt_override: "off"` keeps the behaviour the site has always
 * had — the user is subscribed when the form says so, with no confirmation mail.
 * The welcome email stays off because today nothing is sent on signup.
 */
export async function createSubscription(email, { source } = {}) {
  const { subscription } = await request("/subscriptions", {
    method: "POST",
    body: {
      email,
      reactivate_existing: true,
      send_welcome_email: false,
      double_opt_override: "off",
      // Where on the site the person subscribed, so beehiiv can segment on it.
      utm_source: source || undefined,
      utm_medium: "website",
    },
  });
  return subscription;
}

/**
 * Takes an address off the list. Returns false when beehiiv never had it, which
 * is not an error: the caller still wants our own table marked unsubscribed.
 */
export async function unsubscribe(email) {
  const { found } = await request(subscriptionPath(email), {
    method: "PUT",
    body: { unsubscribe: true },
  });
  return found;
}
