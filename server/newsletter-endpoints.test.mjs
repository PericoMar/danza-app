// Behaviour of the three /api/newsletter functions with beehiiv underneath.
// Lives here rather than next to the handlers because everything under api/
// becomes a deployed route, test files included.

// Named with the `mock` prefix so babel's jest hoisting allows the factory
// below to reference it. The factory only creates the arrow; it dereferences
// this object when a handler asks for a client, long after the module is loaded.
const mockSupabase = {
  table: null,
  inserts: [],
  insertError: null,
  reset() {
    this.table = null;
    this.inserts = [];
    this.insertError = null;
  },
  from(table) {
    this.table = table;
    return this;
  },
  insert(row) {
    this.inserts.push(row);
    return Promise.resolve({ error: this.insertError });
  },
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

import subscribe from "../api/newsletter/index.mjs";
import status from "../api/newsletter/status.mjs";
import unsubscribe from "../api/newsletter/unsubscribe.mjs";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function beehiivOk(body) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function beehiivStatus(code) {
  return {
    ok: false,
    status: code,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("error"),
  };
}

function post(body) {
  return { method: "POST", headers: { "user-agent": "jest" }, body, socket: {} };
}

function fakeRes() {
  const res = { headers: {}, code: null, payload: null };
  res.setHeader = (key, value) => {
    res.headers[key] = value;
  };
  res.status = (code) => {
    res.code = code;
    return res;
  };
  res.json = (payload) => {
    res.payload = payload;
    return res;
  };
  res.end = () => res;
  return res;
}

let consoleSpies = [];

beforeEach(() => {
  mockFetch.mockReset();
  mockSupabase.reset();
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role_dummy";
  process.env.BEEHIIV_API_KEY = "key_test";
  process.env.BEEHIIV_PUBLICATION_ID = "pub_test";
  consoleSpies = ["log", "warn", "error"].map((level) =>
    jest.spyOn(console, level).mockImplementation(() => {})
  );
});

afterEach(() => {
  consoleSpies.forEach((spy) => spy.mockRestore());
});

// ─── subscribe ───────────────────────────────────────────────────────────────

describe("POST /api/newsletter", () => {
  it("subscribes a new address and records the consent", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(404)) // lookup: not on the list yet
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_1", status: "active" } }));

    const res = fakeRes();
    await subscribe(post({ email: "New@Example.com", source: "newsletter_page" }), res);

    expect(res.code).toBe(200);
    expect(res.payload).toMatchObject({
      success: true,
      already_subscribed: false,
      status: "subscribed",
    });
    expect(mockSupabase.table).toBe("newsletter_consents");
    expect(mockSupabase.inserts).toHaveLength(1);
    expect(mockSupabase.inserts[0]).toMatchObject({
      // Stored lowercased, like every other address in the project.
      email: "new@example.com",
      source: "newsletter_page",
      beehiiv_subscription_id: "sub_1",
      consent_user_agent: "jest",
    });
    expect(mockSupabase.inserts[0].consented_at).toEqual(expect.any(String));
  });

  it("tells the client when beehiiv already had the address active", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_2", status: "active" } }))
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_2", status: "active" } }));

    const res = fakeRes();
    await subscribe(post({ email: "old@example.com" }), res);

    expect(res.payload).toMatchObject({ already_subscribed: true });
  });

  it("does not count a pending or inactive subscription as already subscribed", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_3", status: "inactive" } }))
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_3", status: "active" } }));

    const res = fakeRes();
    await subscribe(post({ email: "back@example.com" }), res);

    expect(res.payload).toMatchObject({ already_subscribed: false });
  });

  it("fails instead of promising a subscription beehiiv refused", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(404))
      .mockResolvedValueOnce(beehiivStatus(500));

    const res = fakeRes();
    await subscribe(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(502);
    // No consent is logged for a subscription that never happened.
    expect(mockSupabase.inserts).toHaveLength(0);
  });

  it("reports 'validating' so the success screen can say the address is being checked", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(404))
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_10", status: "validating" } }));

    const res = fakeRes();
    await subscribe(post({ email: "fresh@example.com" }), res);

    expect(res.code).toBe(200);
    expect(res.payload).toMatchObject({ status: "validating" });
  });

  it("rejects an address beehiiv considers invalid", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(404))
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_4", status: "invalid" } }));

    const res = fakeRes();
    await subscribe(post({ email: "bad@example.com" }), res);

    expect(res.code).toBe(400);
    expect(mockSupabase.inserts).toHaveLength(0);
  });

  it("subscribes anyway when beehiiv can't say whether they were already on the list", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(503)) // lookup fails
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_5", status: "active" } }));

    const res = fakeRes();
    await subscribe(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(200);
    // Only the wording depends on it, so an unknown falls to the plain version.
    expect(res.payload).toMatchObject({ already_subscribed: false });
    expect(mockSupabase.inserts).toHaveLength(1);
  });

  it("still reports success when the consent record can't be written", async () => {
    mockSupabase.insertError = { message: "insert failed" };
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(404))
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_11", status: "active" } }));

    const res = fakeRes();
    await subscribe(post({ email: "user@example.com" }), res);

    // They are on the list in beehiiv. Retrying would not fix our own record.
    expect(res.code).toBe(200);
  });
});

// ─── status ──────────────────────────────────────────────────────────────────

describe("POST /api/newsletter/status", () => {
  it("reports subscribed when beehiiv says active", async () => {
    mockFetch.mockResolvedValueOnce(
      beehiivOk({ data: { id: "sub_6", status: "active" } })
    );

    const res = fakeRes();
    await status(post({ email: "user@example.com" }), res);

    expect(res.payload).toEqual({ status: "subscribed" });
  });

  it("reports not subscribed when beehiiv has never seen the address", async () => {
    mockFetch.mockResolvedValueOnce(beehiivStatus(404));

    const res = fakeRes();
    await status(post({ email: "gone@example.com" }), res);

    expect(res.payload).toEqual({ status: "not_subscribed" });
  });

  it("reports not subscribed for a pending double opt-in", async () => {
    mockFetch.mockResolvedValueOnce(
      beehiivOk({ data: { id: "sub_7", status: "pending" } })
    );

    const res = fakeRes();
    await status(post({ email: "user@example.com" }), res);

    expect(res.payload).toEqual({ status: "not_subscribed" });
  });

  it("reports 'validating' while beehiiv is still checking the address", async () => {
    mockFetch.mockResolvedValueOnce(
      beehiivOk({ data: { id: "sub_9", status: "validating" } })
    );

    const res = fakeRes();
    await status(post({ email: "fresh@example.com" }), res);

    expect(res.payload).toEqual({ status: "validating" });
  });

  it("says it can't answer instead of guessing when beehiiv is down", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNRESET"));

    const res = fakeRes();
    await status(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(503);
    // No second opinion is consulted: a stale one could only be wronger.
    expect(mockSupabase.table).toBeNull();
  });
});

// ─── unsubscribe ─────────────────────────────────────────────────────────────

describe("POST /api/newsletter/unsubscribe", () => {
  it("unsubscribes in beehiiv and leaves the consent log alone", async () => {
    mockFetch.mockResolvedValueOnce(
      beehiivOk({ data: { id: "sub_8", status: "inactive" } })
    );

    const res = fakeRes();
    await unsubscribe(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(200);
    // The consent log is append-only: leaving doesn't unsay the consent.
    expect(mockSupabase.inserts).toHaveLength(0);
  });

  it("succeeds when beehiiv never had the address", async () => {
    mockFetch.mockResolvedValueOnce(beehiivStatus(404));

    const res = fakeRes();
    await unsubscribe(post({ email: "nobody@example.com" }), res);

    expect(res.code).toBe(200);
  });

  it("fails when beehiiv is unreachable instead of reporting success", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNRESET"));

    const res = fakeRes();
    await unsubscribe(post({ email: "user@example.com" }), res);

    // Reporting success would hide that beehiiv still mails them.
    expect(res.code).toBe(502);
  });
});
