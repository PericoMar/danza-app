// Picks a font size for text that must fit a box without measuring it. React
// Native has no synchronous text measurement (and react-native-web ignores
// `adjustsFontSizeToFit`), so widths are estimated from average glyph widths.

/** Average advance widths, in em, for a font + weight. */
export interface GlyphMetrics {
  /** Lowercase letters and punctuation. */
  lower: number;
  /** Uppercase letters and digits. */
  upper: number;
  space: number;
}

interface FitFontSizeOptions {
  maxWidth: number;
  maxLines: number;
  maxFont: number;
  minFont: number;
  glyphs: GlyphMetrics;
  /** Extra px per glyph, as in the `letterSpacing` style. */
  letterSpacing?: number;
}

function isWideGlyph(ch: string): boolean {
  return ch !== ch.toLowerCase() || (ch >= "0" && ch <= "9");
}

function wordWidth(word: string, fontSize: number, glyphs: GlyphMetrics, letterSpacing: number): number {
  let em = 0;
  for (const ch of word) em += isWideGlyph(ch) ? glyphs.upper : glyphs.lower;
  return em * fontSize + [...word].length * letterSpacing;
}

/** Lines needed with greedy word wrap, or Infinity if a word is wider than a line. */
function countLines(
  words: string[],
  fontSize: number,
  maxWidth: number,
  glyphs: GlyphMetrics,
  letterSpacing: number,
): number {
  const space = glyphs.space * fontSize + letterSpacing;
  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const w = wordWidth(word, fontSize, glyphs, letterSpacing);
    if (w > maxWidth) return Infinity;
    if (lineWidth === 0) {
      lineWidth = w;
    } else if (lineWidth + space + w <= maxWidth) {
      lineWidth += space + w;
    } else {
      lines += 1;
      lineWidth = w;
    }
  }
  return lines;
}

/**
 * Largest whole font size in [minFont, maxFont] at which `text` wraps into at
 * most `maxLines` lines of `maxWidth` without splitting a word. Returns
 * `minFont` when nothing fits, so callers should still clamp with ellipsis.
 */
export function fitFontSize(text: string, options: FitFontSizeOptions): number {
  const { maxWidth, maxLines, maxFont, minFont, glyphs, letterSpacing = 0 } = options;
  const words = text.trim().split(/\s+/).filter(Boolean);
  for (let size = Math.floor(maxFont); size > minFont; size -= 1) {
    if (countLines(words, size, maxWidth, glyphs, letterSpacing) <= maxLines) return size;
  }
  return minFont;
}
