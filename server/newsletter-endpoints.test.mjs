// Behaviour of the three /api/newsletter functions with beehiiv underneath.
// Lives here rather than next to the handlers because everything under api/
// becomes a deployed route, test files included.

// Named with the `mock` prefix so babel's jest hoisting allows the factory
// below to reference it. The factory only creates the arrow; it dereferences
// this object when a handler asks for a client, long after the module is loaded.
const mockSupabase = {
  table: null,
  selectResult: { data: null, error: null },
  upserts: [],
  updates: [],
  reset() {
    this.table = null;
    this.selectResult = { data: null, error: null };
    this.upserts = [];
    this.updates = [];
  },
  from(table) {
    this.table = table;
    return this;
  },
  select() {
    return this;
  },
  eq() {
    return this;
  },
  maybeSingle() {
    return Promise.resolve(this.selectResult);
  },
  upsert(row, options) {
    this.upserts.push({ row, options });
    return Promise.resolve({ error: null });
  },
  update(row) {
    this.updates.push(row);
    return { eq: () => Promise.resolve({ error: null }) };
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
    expect(res.payload).toMatchObject({ success: true, already_subscribed: false });
    expect(mockSupabase.upserts).toHaveLength(1);
    expect(mockSupabase.upserts[0].row).toMatchObject({
      // Stored lowercased, like every other address in the project.
      email: "new@example.com",
      status: "subscribed",
      beehiiv_subscription_id: "sub_1",
      source: "newsletter_page",
      // Resubscribing has to clear the old unsubscribe stamp.
      unsubscribed_at: null,
    });
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
    // Nothing is written: our table must not claim a subscription that isn't real.
    expect(mockSupabase.upserts).toHaveLength(0);
  });

  it("rejects an address beehiiv considers invalid", async () => {
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(404))
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_4", status: "invalid" } }));

    const res = fakeRes();
    await subscribe(post({ email: "bad@example.com" }), res);

    expect(res.code).toBe(400);
    expect(mockSupabase.upserts).toHaveLength(0);
  });

  it("falls back to our own table when the beehiiv lookup fails", async () => {
    mockSupabase.selectResult = { data: { status: "subscribed" }, error: null };
    mockFetch
      .mockResolvedValueOnce(beehiivStatus(503)) // lookup fails
      .mockResolvedValueOnce(beehiivOk({ data: { id: "sub_5", status: "active" } }));

    const res = fakeRes();
    await subscribe(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(200);
    expect(res.payload).toMatchObject({ already_subscribed: true });
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

  it("trusts a beehiiv 404 over our own table", async () => {
    // The row says subscribed, but the person unsubscribed from an email footer.
    mockSupabase.selectResult = { data: { status: "subscribed" }, error: null };
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

  it("falls back to our own table when beehiiv is down", async () => {
    mockSupabase.selectResult = { data: { status: "subscribed" }, error: null };
    mockFetch.mockRejectedValueOnce(new Error("ECONNRESET"));

    const res = fakeRes();
    await status(post({ email: "user@example.com" }), res);

    expect(res.payload).toEqual({ status: "subscribed" });
  });
});

// ─── unsubscribe ─────────────────────────────────────────────────────────────

describe("POST /api/newsletter/unsubscribe", () => {
  it("unsubscribes in beehiiv and then in our table", async () => {
    mockFetch.mockResolvedValueOnce(
      beehiivOk({ data: { id: "sub_8", status: "inactive" } })
    );

    const res = fakeRes();
    await unsubscribe(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(200);
    expect(mockSupabase.updates[0]).toMatchObject({ status: "unsubscribed" });
    expect(mockSupabase.updates[0].unsubscribed_at).toEqual(expect.any(String));
  });

  it("still records the unsubscribe when beehiiv never had the address", async () => {
    mockFetch.mockResolvedValueOnce(beehiivStatus(404));

    const res = fakeRes();
    await unsubscribe(post({ email: "nobody@example.com" }), res);

    expect(res.code).toBe(200);
    expect(mockSupabase.updates).toHaveLength(1);
  });

  it("fails without touching our table when beehiiv is unreachable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNRESET"));

    const res = fakeRes();
    await unsubscribe(post({ email: "user@example.com" }), res);

    expect(res.code).toBe(502);
    // Marking them unsubscribed here would hide that beehiiv still mails them.
    expect(mockSupabase.updates).toHaveLength(0);
  });
});
