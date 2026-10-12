import { Platform } from "react-native";
import {
  PAGE_CONTENT_MAX_WIDTH,
  PAGE_H_PADDING,
  PAGE_H_PADDING_COMPACT,
  PAGE_H_PADDING_BREAKPOINT,
} from "@/constants/layout";

// ─── Fonts ───────────────────────────────────────────────────────────────────
// The Companies design ("Companies.html") uses Inter for every role, leaning on
// weight + letter-spacing rather than multiple families.

export const INTER: any = Platform.select({
  web: '"Inter", ui-sans-serif, system-ui, sans-serif',
  default: undefined,
});

// Same family everywhere; kept as separate names to mirror the design's roles.
export const DISPLAY = INTER;
export const MONO_LABEL = INTER;

// ─── Layout helpers ──────────────────────────────────────────────────────────

export function pageMaxWidth(width: number): number {
  return Math.min(width, PAGE_CONTENT_MAX_WIDTH);
}

export function pageHPadding(width: number): number {
  return width <= PAGE_H_PADDING_BREAKPOINT ? PAGE_H_PADDING_COMPACT : PAGE_H_PADDING;
}

// Chrome-style linear-gradient orientation (~168deg): mostly vertical, slight lean.
export const CHROME_GRADIENT_START = { x: 0.12, y: 0 };
export const CHROME_GRADIENT_END = { x: 0.88, y: 1 };

// Headline gradient orientation (~178deg, i.e. near-vertical): matches
// Gradients.headline.css so native GradientText lines up with the web version.
export const HEADLINE_GRADIENT_START = { x: 0.48, y: 0 };
export const HEADLINE_GRADIENT_END = { x: 0.52, y: 1 };

// ─── Font loader (web-only, idempotent) ──────────────────────────────────────

export function loadCompaniesFonts(): void {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    if (!document.getElementById("danza-companies-fonts")) {
      const link = document.createElement("link");
      link.id = "danza-companies-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }
  }
}

// Web-only CSS text gradient for the emphasised headline line. On native this
// object is empty and callers fall back to a solid colour.
export function webTextGradient(css: string): any {
  if (Platform.OS !== "web") return {};
  return {
    backgroundImage: css,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };
}
