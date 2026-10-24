// Behaviour of /api/company-redirect. Lives here rather than next to the
// handler because everything under api/ becomes a deployed route.

// Named with the `mock` prefix so babel's jest hoisting allows the factory
// below to reference it.
const mockSupabase = {
  row: null,
  error: null,
  filters: [],
  reset() {
    this.row = null;
    this.error = null;
    this.filters = [];
  },
  from() {
    return this;
  },
  select() {
    return this;
  },
  eq(column, value) {
    this.filters.push([column, value]);
    return this;
  },
  maybeSingle() {
    return Promise.resolve({ data: this.row, error: this.error });
  },
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

import companyRedirect from "../api/company-redirect.mjs";

const COMPANY_ID = "3a288adc-9dbe-4375-8ddf-f1073a133d89";

function get(id) {
  return { method: "GET", query: { id }, headers: {} };
}

function fakeRes() {
  const res = { headers: {}, code: null };
  res.setHeader = (key, value) => {
    res.headers[key] = value;
  };
  res.status = (code) => {
    res.code = code;
    return res;
  };
  res.end = () => res;
  return res;
}

let consoleSpy;

beforeEach(() => {
  mockSupabase.reset();
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
});

it("sends a uuid to the company's slug with a permanent redirect", async () => {
  mockSupabase.row = { slug: "soulmagnet" };
  const res = fakeRes();

  await companyRedirect(get(COMPANY_ID), res);

  expect(res.code).toBe(308);
  expect(res.headers.Location).toBe("/insights/soulmagnet");
  expect(mockSupabase.filters).toEqual([["id", COMPANY_ID]]);
});

it("sends a uuid that names no company to the listing, temporarily", async () => {
  const res = fakeRes();

  await companyRedirect(get(COMPANY_ID), res);

  expect(res.code).toBe(307);
  expect(res.headers.Location).toBe("/companies");
});

it("never queries the database with something that isn't a uuid", async () => {
  const res = fakeRes();

  await companyRedirect(get("soulmagnet' or 1=1"), res);

  expect(res.code).toBe(307);
  expect(mockSupabase.filters).toEqual([]);
});

it("falls back to the listing when the lookup fails", async () => {
  mockSupabase.error = { message: "boom" };
  const res = fakeRes();

  await companyRedirect(get(COMPANY_ID), res);

  expect(res.code).toBe(307);
  expect(res.headers.Location).toBe("/companies");
});

it("rejects verbs other than GET", async () => {
  const res = fakeRes();

  await companyRedirect({ method: "POST", query: { id: COMPANY_ID }, headers: {} }, res);

  expect(res.code).toBe(405);
});
