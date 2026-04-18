import { Platform, StyleSheet } from "react-native";
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

export const INK_2 = "#474747cc";
export const INK_3 = "#929294";
export const DARK = "#101012";
export const RULE = "rgba(0,0,0,0.08)";
export const RULE_STRONG = "rgba(0,0,0,0.14)";

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

// ─── Shared styles ────────────────────────────────────────────────────────────

export const landingStyles = StyleSheet.create({
  // Navbar
  navbar: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  navInner: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: RULE,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  brandWord: { fontSize: 22, fontWeight: "500", color: "#000" },
  navLinks: { flexDirection: "row", gap: 36 },
  navLink: { fontSize: 14, letterSpacing: 0.3, color: "#000" },
  navCta: {
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 6,
  },
  navCtaText: { color: "#fff", fontSize: 13, fontWeight: "500", letterSpacing: 0.3 },

  // Hero decoration
  heroMark: {
    position: "absolute",
    bottom: "8%",
    left: "4%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.purple,
  },
  heroMarkText: { fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: INK_3 },

  // Buttons
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
  },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
  btnGhost: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
  },
  btnGhostText: { color: "#000", fontSize: 14, fontWeight: "400" },

  // Dark CTA form
  ctaForm: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
    gap: 8,
    alignItems: "stretch",
  },
  ctaInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  ctaBtn: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnSent: { backgroundColor: "#2a2a2a" },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
});
