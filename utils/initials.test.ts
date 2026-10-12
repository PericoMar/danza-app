import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first letter of the first two words", () => {
    expect(getInitials("ana ruiz garcía")).toBe("AR");
  });

  it("skips connector words", () => {
    expect(getInitials("María de la Cruz")).toBe("MC");
    expect(getInitials("Compañía Nacional de Danza")).toBe("ND");
  });

  it("falls back to every word when all are stopwords", () => {
    expect(getInitials("The Company")).toBe("TC");
  });

  it("returns an empty string for blank input", () => {
    expect(getInitials("   ")).toBe("");
  });
});
