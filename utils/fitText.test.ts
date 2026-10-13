import { fitFontSize, type GlyphMetrics } from "./fitText";

// Round numbers keep the expected sizes easy to derive by hand:
// lowercase = 0.5em, uppercase/digits = 1em, space = 0.5em.
const GLYPHS: GlyphMetrics = { lower: 0.5, upper: 1, space: 0.5 };

const fit = (text: string, maxWidth: number, maxLines: number, letterSpacing = 0) =>
  fitFontSize(text, { maxWidth, maxLines, maxFont: 10, minFont: 2, glyphs: GLYPHS, letterSpacing });

describe("fitFontSize", () => {
  it("keeps the max size when the text fits on one line", () => {
    // "aaaa" = 2em → 20px at 10px.
    expect(fit("aaaa", 30, 1)).toBe(10);
  });

  it("keeps the max size when the text wraps within the allowed lines", () => {
    // Each word is 20px at 10px; two words + a space (45px) fit, the third wraps.
    expect(fit("aaaa aaaa aaaa", 45, 2)).toBe(10);
  });

  it("shrinks until the text fits in the allowed lines", () => {
    // 7em in total on one 45px line → 6px.
    expect(fit("aaaa aaaa aaaa", 45, 1)).toBe(6);
  });

  it("wraps on word boundaries instead of splitting the total width evenly", () => {
    // 10em in total would "fit" 2 × 40px at 8px, but three 3em words only pair
    // up once 6.5em ≤ 40px → 6px.
    expect(fit("aaaaaa aaaaaa aaaaaa", 40, 2)).toBe(6);
  });

  it("never splits a word: the longest one must fit on a line", () => {
    // A single 10em word on 40px lines → 4px, even with lines to spare.
    expect(fit("aaaaaaaaaaaaaaaaaaaa", 40, 3)).toBe(4);
  });

  it("treats uppercase letters and digits as wider glyphs", () => {
    expect(fit("aaaa", 30, 1)).toBe(10);
    expect(fit("AAAA", 30, 1)).toBe(7);
    expect(fit("1234", 30, 1)).toBe(7);
  });

  it("accounts for letter spacing", () => {
    // 2em + 4 × -1px = 16px at 10px; without it the text would need 20px.
    expect(fit("aaaa", 16, 1, -1)).toBe(10);
  });

  it("ignores extra whitespace", () => {
    expect(fit("  aaaa   aaaa  ", 45, 1)).toBe(fit("aaaa aaaa", 45, 1));
  });

  it("bottoms out at the min size when nothing fits", () => {
    expect(fit("aaaaaaaaaaaaaaaaaaaa", 5, 2)).toBe(2);
  });
});
