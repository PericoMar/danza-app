import { Platform } from "react-native";
import { Colors } from "./colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";

// ─── Fonts ───────────────────────────────────────────────────────────────────

export const SERIF: any = Platform.select({
  web: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  default: "Georgia",
});

export const SANS: any = Platform.select({
  web: '"DM Sans", system-ui, sans-serif',
  default: undefined,
});

export const MONO: any = Platform.select({
  web: '"JetBrains Mono", "Courier New", monospace',
  default: "monospace",
});

// ─── Color tokens ─────────────────────────────────────────────────────────────
// Landing-scoped aliases for the shared palette. The names mirror the original
// design's roles; the values are the single source of truth in `theme/colors`.

export const INK_2 = Colors.textLightDark;   // "#474747cc"
export const INK_3 = Colors.textMuted;       // "#929294ff"
export const DARK = Colors.gray2;            // "#101012"
export const RULE = Colors.rule;             // "rgba(0,0,0,0.08)"
export const RULE_STRONG = Colors.ruleStrong; // "rgba(0,0,0,0.14)"

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function wrap(w: number): number {
  return Math.min(w, 1320);
}

export function hPad(w: number): number {
  return w < TABLET_BREAKPOINT ? 22 : 40;
}

// ─── Font loader (web-only, idempotent) ───────────────────────────────────────

export function loadLandingFonts(): void {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    if (!document.getElementById("danza-landing-fonts")) {
      const link = document.createElement("link");
      link.id = "danza-landing-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }
}

// Shared marketing chrome (navbar + buttons + CTA form styles) moved to
// components/common/siteStyles.ts — a theme file shouldn't ship a StyleSheet.
