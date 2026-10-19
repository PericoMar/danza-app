import { Platform } from "react-native";
import {
  PAGE_BACKGROUND_CSS_VAR,
  PAGE_BACKGROUND_DEFAULT,
  PAGE_BACKGROUND_GLASS_ALPHA,
  PAGE_BACKGROUND_GLASS_CSS_VAR,
  PAGE_BACKGROUND_STORAGE_KEY,
  PAGE_BACKGROUND_SUNKEN_CSS_VAR,
  PAGE_BACKGROUND_SUNKEN_FACTOR,
} from "@/constants/pageBackground";

// The page-background try-out (see constants/pageBackground.ts). Native styles
// are fixed when the app starts, so there it is a no-op and reads as white.

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Only a real browser: `expo export` renders on web too, without a DOM. */
export const isPageBackgroundSupported =
  Platform.OS === "web" && typeof document !== "undefined";

/** "#fAf6eC", "faf6ec" → "#FAF6EC"; anything else → null. */
export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return HEX_COLOR.test(withHash) ? withHash.toUpperCase() : null;
}

function channelsOf(hex: string): [number, number, number] {
  const channel = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16);
  return [channel(1), channel(3), channel(5)];
}

function glassOf(hex: string): string {
  return `rgba(${channelsOf(hex).join(",")},${PAGE_BACKGROUND_GLASS_ALPHA})`;
}

function sunkenOf(hex: string): string {
  const [r, g, b] = channelsOf(hex).map((c) => Math.round(c * PAGE_BACKGROUND_SUNKEN_FACTOR));
  return `rgb(${r},${g},${b})`;
}

/** The colour this browser picked, or white when it never picked one. */
export function readPageBackground(): string {
  if (!isPageBackgroundSupported) return PAGE_BACKGROUND_DEFAULT;
  try {
    const stored = localStorage.getItem(PAGE_BACKGROUND_STORAGE_KEY);
    return (stored && normalizeHexColor(stored)) || PAGE_BACKGROUND_DEFAULT;
  } catch {
    return PAGE_BACKGROUND_DEFAULT;
  }
}

function applyPageBackground(hex: string): void {
  const root = document.documentElement.style;
  if (hex === PAGE_BACKGROUND_DEFAULT) {
    root.removeProperty(PAGE_BACKGROUND_CSS_VAR);
    root.removeProperty(PAGE_BACKGROUND_GLASS_CSS_VAR);
    root.removeProperty(PAGE_BACKGROUND_SUNKEN_CSS_VAR);
    root.removeProperty("background-color");
    return;
  }
  root.setProperty(PAGE_BACKGROUND_CSS_VAR, hex);
  root.setProperty(PAGE_BACKGROUND_GLASS_CSS_VAR, glassOf(hex));
  root.setProperty(PAGE_BACKGROUND_SUNKEN_CSS_VAR, sunkenOf(hex));
  // What shows past the edges when a trackpad overscrolls the page.
  root.setProperty("background-color", hex);
}

/** Remembers `hex` on this browser and repaints every page with it. White forgets. */
export function savePageBackground(hex: string): void {
  if (!isPageBackgroundSupported) return;
  try {
    if (hex === PAGE_BACKGROUND_DEFAULT) localStorage.removeItem(PAGE_BACKGROUND_STORAGE_KEY);
    else localStorage.setItem(PAGE_BACKGROUND_STORAGE_KEY, hex);
  } catch {
    // Private mode: it still applies until the tab closes.
  }
  applyPageBackground(hex);
}

/** Run once at startup, before the first render. */
export function applyStoredPageBackground(): void {
  if (!isPageBackgroundSupported) return;
  applyPageBackground(readPageBackground());
}
