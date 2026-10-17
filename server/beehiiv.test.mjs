// Pins the beehiiv contract: the exact URLs, verbs and body the newsletter
// endpoints depend on, and the mapping from beehiiv's seven states to the one
// question we ask ("does this person get the newsletter?").

import {
  BeehiivError,
  BeehiivStatus,
  createSubscription,
  findSubscription,
  isBeehiivConfigured,
  isSubscribedStatus,
  toSubscriptionState,
  unsubscribe,
} from "./beehiiv.mjs";

const PUBLICATION = "pub_test";
const BASE = `https://api.beehiiv.com/v2/publications/${PUBLICATION}`;

const mockFetch = jest.fn();
global.fetch = mockFetch;

function ok(body) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function notFound() {
  return {
    ok: false,
    status: 404,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("not found"),
  };
}

function failure(status, body = "boom") {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.BEEHIIV_API_KEY = "key_test";
  process.env.BEEHIIV_PUBLICATION_ID = PUBLICATION;
});

// ─── status mapping ──────────────────────────────────────────────────────────

describe("isSubscribedStatus", () => {
  it("counts only 'active' as subscribed", () => {
    expect(isSubscribedStatus(BeehiivStatus.ACTIVE)).toBe(true);
  });

  it.each([
    BeehiivStatus.PENDING,
    BeehiivStatus.INACTIVE,
    BeehiivStatus.INVALID,
    BeehiivStatus.VALIDATING,
    BeehiivStatus.PAUSED,
    BeehiivStatus.NEEDS_ATTENTION,
  ])("does not count '%s' as subscribed", (status) => {
    expect(isSubscribedStatus(status)).toBe(false);
  });

  it("treats a missing status as not subscribed", () => {
    expect(isSubscribedStatus(undefined)).toBe(false);
    expect(isSubscribedStatus(null)).toBe(false);
  });
});

describe("toSubscriptionState", () => {
  it("maps active to subscribed and validating to its own state", () => {
    expect(toSubscriptionState(BeehiivStatus.ACTIVE)).toBe("subscribed");
    expect(toSubscriptionState(BeehiivStatus.VALIDATING)).toBe("validating");
  });

  it.each([
    BeehiivStatus.PENDING,
    BeehiivStatus.INACTIVE,
    BeehiivStatus.INVALID,
    BeehiivStatus.PAUSED,
    BeehiivStatus.NEEDS_ATTENTION,
    undefined,
    "a state beehiiv added after this was written",
  ])("maps %s to not_subscribed", (status) => {
    expect(toSubscriptionState(status)).toBe("not_subscribed");
  });
});

describe("isBeehiivConfigured", () => {
  it("needs both the key and the publication", () => {
    expect(isBeehiivConfigured()).toBe(true);

    delete process.env.BEEHIIV_PUBLICATION_ID;
    expect(isBeehiivConfigured()).toBe(false);

    process.env.BEEHIIV_PUBLICATION_ID = PUBLICATION;
    delete process.env.BEEHIIV_API_KEY;
    expect(isBeehiivConfigured()).toBe(false);
  });
});

// ─── findSubscription ────────────────────────────────────────────────────────

describe("findSubscription", () => {
  it("reads the subscription out of the data wrapper", async () => {
    mockFetch.mockResolvedValueOnce(ok({ data: { id: "sub_1", status: "active" } }));

    await expect(findSubscription("user@example.com")).resolves.toEqual({
      id: "sub_1",
      status: "active",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/subscriptions/by_email/user%40example.com`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer key_test" }),
      })
    );
  });

  it("url-encodes addresses with characters that would break the path", async () => {
    mockFetch.mockResolvedValueOnce(ok({ data: { id: "sub_2", status: "active" } }));

    await findSubscription("a+tag@example.com");

    expect(mockFetch.mock.calls[0][0]).toBe(
      `${BASE}/subscriptions/by_email/a%2Btag%40example.com`
    );
  });

  it("returns null when beehiiv has never seen the address", async () => {
    mockFetch.mockResolvedValueOnce(notFound());

    await expect(findSubscription("nobody@example.com")).resolves.toBeNull();
  });

  it("throws with the status when beehiiv fails", async () => {
    mockFetch.mockResolvedValueOnce(failure(429, "rate limited"));

    await expect(findSubscription("user@example.com")).rejects.toMatchObject({
      name: "BeehiivError",
      status: 429,
    });
  });

  it("throws when beehiiv is unreachable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNRESET"));

    await expect(findSubscription("user@example.com")).rejects.toBeInstanceOf(
      BeehiivError
    );
  });
});

// ─── createSubscription ──────────────────────────────────────────────────────

describe("createSubscription", () => {
  it("posts the options the site's behaviour depends on", async () => {
    mockFetch.mockResolvedValueOnce(ok({ data: { id: "sub_3", status: "active" } }));

    await expect(
      createSubscription("user@example.com", { source: "newsletter_page" })
    ).resolves.toEqual({ id: "sub_3", status: "active" });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/subscriptions`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "user@example.com",
      // Without this, resubscribing after an unsubscribe silently does nothing.
      reactivate_existing: true,
      // The form says "you're subscribed", so there is no confirmation step.
      double_opt_override: "off",
      send_welcome_email: false,
      utm_source: "newsletter_page",
      utm_medium: "website",
    });
  });

  it("omits utm_source when the caller gives no source", async () => {
    mockFetch.mockResolvedValueOnce(ok({ data: { id: "sub_4", status: "active" } }));

    await createSubscription("user@example.com");

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).not.toHaveProperty(
      "utm_source"
    );
  });

  it("surfaces an address beehiiv considers invalid", async () => {
    mockFetch.mockResolvedValueOnce(ok({ data: { id: "sub_5", status: "invalid" } }));

    await expect(createSubscription("nope@example.com")).resolves.toEqual({
      id: "sub_5",
      status: "invalid",
    });
  });
});

// ─── unsubscribe ─────────────────────────────────────────────────────────────

describe("unsubscribe", () => {
  it("puts unsubscribe: true on the address", async () => {
    mockFetch.mockResolvedValueOnce(ok({ data: { id: "sub_6", status: "inactive" } }));

    await expect(unsubscribe("user@example.com")).resolves.toBe(true);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/subscriptions/by_email/user%40example.com`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ unsubscribe: true });
  });

  it("reports an address beehiiv never had instead of failing", async () => {
    mockFetch.mockResolvedValueOnce(notFound());

    await expect(unsubscribe("nobody@example.com")).resolves.toBe(false);
  });

  it("throws when beehiiv rejects the request", async () => {
    mockFetch.mockResolvedValueOnce(failure(500));

    await expect(unsubscribe("user@example.com")).rejects.toBeInstanceOf(
      BeehiivError
    );
  });
});
