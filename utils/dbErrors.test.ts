import { isMissingTableError } from "./dbErrors";

describe("isMissingTableError", () => {
  it("recognises a missing table from Postgres and from PostgREST", () => {
    expect(isMissingTableError({ code: "42P01", message: 'relation "public.x" does not exist' })).toBe(true);
    expect(isMissingTableError({ code: "PGRST205", message: "Could not find the table" })).toBe(true);
  });

  it("ignores any other error", () => {
    expect(isMissingTableError({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isMissingTableError(new Error("Failed to fetch"))).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
  });
});
