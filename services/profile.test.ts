import { fetchProfile, saveProfile, EMPTY_PROFILE } from "./profile";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// A chainable stand-in for the bits of the supabase query builder the service uses.

const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();
const mockUpsert = jest.fn();

jest.mock("@/services/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
      upsert: (...args: unknown[]) => {
        mockUpsert(...args);
        return { select: () => ({ single: mockSingle }) };
      },
    }),
  },
}));

beforeEach(() => {
  mockMaybeSingle.mockReset();
  mockSingle.mockReset();
  mockUpsert.mockReset();
});

// ─── fetchProfile ─────────────────────────────────────────────────────────────

describe("fetchProfile", () => {
  it("maps NULL columns to empty strings", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { name: "Ana", last_name: null, bio: null, instagram_url: "ig", linkedin_url: null },
      error: null,
    });

    await expect(fetchProfile("u1")).resolves.toEqual({
      ...EMPTY_PROFILE,
      name: "Ana",
      instagram_url: "ig",
    });
  });

  it("returns an empty profile when the row is missing", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(fetchProfile("u1")).resolves.toEqual(EMPTY_PROFILE);
  });

  it("throws the query error", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(fetchProfile("u1")).rejects.toThrow("boom");
  });
});

// ─── saveProfile ──────────────────────────────────────────────────────────────

describe("saveProfile", () => {
  it("trims values and stores blank optional fields as NULL", async () => {
    mockSingle.mockResolvedValue({
      data: { name: "Ana", last_name: "Ruiz", bio: null, instagram_url: null, linkedin_url: null },
      error: null,
    });

    const saved = await saveProfile("u1", {
      name: "  Ana ",
      last_name: " Ruiz",
      bio: "   ",
      instagram_url: "",
      linkedin_url: "  ",
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "u1",
        name: "Ana",
        last_name: "Ruiz",
        bio: null,
        instagram_url: null,
        linkedin_url: null,
      },
      { onConflict: "user_id" }
    );
    expect(saved).toEqual({ ...EMPTY_PROFILE, name: "Ana", last_name: "Ruiz" });
  });

  it("only writes profile columns", async () => {
    mockSingle.mockResolvedValue({ data: EMPTY_PROFILE, error: null });
    await saveProfile("u1", { ...EMPTY_PROFILE, name: "Ana" });

    const [payload] = mockUpsert.mock.calls[0];
    expect(Object.keys(payload).sort()).toEqual(
      ["bio", "instagram_url", "last_name", "linkedin_url", "name", "user_id"]
    );
  });

  it("throws the upsert error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error("denied") });
    await expect(saveProfile("u1", { ...EMPTY_PROFILE, name: "Ana" })).rejects.toThrow("denied");
  });
});
