// A try-out for the page background: an admin picks another base colour from
// /admin/settings and sees the whole site in it, on that browser only. Nothing
// is stored server-side, and without a choice every page stays white.
// Web only: the colour lives in a CSS variable that `Colors.bg` reads.

export const PAGE_BACKGROUND_CSS_VAR = "--page-bg";
/** The same colour, see-through, for the bars that blur the page under them. */
export const PAGE_BACKGROUND_GLASS_CSS_VAR = "--page-bg-glass";
export const PAGE_BACKGROUND_GLASS_ALPHA = 0.92;
/** A shade darker, for the panels inside a card (company logo, audition strip). */
export const PAGE_BACKGROUND_SUNKEN_CSS_VAR = "--page-bg-sunken";
/** White × this ≈ #F6F6F7, the grey those panels have on a white page. */
export const PAGE_BACKGROUND_SUNKEN_FACTOR = 0.965;

export const PAGE_BACKGROUND_DEFAULT = "#FFFFFF";

export const PAGE_BACKGROUND_STORAGE_KEY = "danza_page_background";

export type PageBackgroundPreset = { name: string; hex: string };

/** The candidates, white first. Ordered from cool to warm. */
export const PAGE_BACKGROUND_PRESETS: readonly PageBackgroundPreset[] = [
  { name: "White", hex: PAGE_BACKGROUND_DEFAULT },
  { name: "Ivory", hex: "#FDFBF5" },
  { name: "Cream", hex: "#FAF6EC" },
  { name: "Linen", hex: "#F5EFE2" },
];
