import { StyleSheet } from "react-native";
import { INTER } from "@/theme/companies";

// ─── Newsletter palette ──────────────────────────────────────────────────────
// The newsletter page steps away from the app's silver/chrome + pink system.
// It's a stark, editorial black-on-white hero: one oversized headline, a short
// description, and a single pill field. No accent colour.
export const NL = {
  ink: "#111111",
  inkSoft: "#3f3f46",
  muted: "#6b6b70",
  bg: "#ffffff",
  hairline: "#ececee",
  fieldBorder: "#dcdce0",
  // The one exception to "no accent colour": the notice shown while the
  // provider is still checking a new address. Soft pastel fill with a saturated
  // text colour, the same shape as the app's success and danger banners.
  warnBg: "#FFFBEB",
  warnBorder: "#FDE68A",
  warnText: "#92400E",
  // On the dark home section the same notice is a tinted amber on near-black.
  warnDarkBg: "rgba(255,214,107,0.12)",
  warnDarkBorder: "rgba(255,214,107,0.32)",
  warnDarkText: "#ffd66b",
} as const;

/** Oversized hero headline that fills ~70–80% of the viewport width. */
export function heroFontSize(width: number, isWide: boolean): number {
  return isWide
    ? Math.max(44, Math.min(Math.round(width * 0.072), 84))
    : Math.max(30, Math.min(Math.round(width * 0.11), 40));
}

export const styles = StyleSheet.create({
  // ─── Screen shell ───
  screen: {
    flex: 1,
    backgroundColor: NL.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: NL.bg,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wrap: {
    width: "100%",
    alignSelf: "center",
  },

  // ─── Hero block ───
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 22,
  },
  eyebrowCentered: {
    alignSelf: "center",
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NL.ink,
  },
  successMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrowText: {
    fontFamily: INTER,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: NL.ink,
  },

  title: {
    fontFamily: INTER,
    fontWeight: "800",
    color: NL.ink,
    letterSpacing: -1.5,
  },
  titleCentered: {
    textAlign: "center",
  },

  subtitle: {
    fontFamily: INTER,
    color: NL.muted,
    maxWidth: 620,
  },
  subtitleWide: {
    fontSize: 17,
    lineHeight: 26,
    marginTop: 22,
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 16,
    textAlign: "center",
  },
  emailHighlight: {
    fontWeight: "700",
    color: NL.ink,
  },

  // ─── Below the field ───
  // The field itself lives in the shared <NewsletterField> component.
  privacyNote: {
    fontFamily: INTER,
    fontSize: 13,
    color: NL.muted,
    marginTop: 18,
  },
  privacyNoteCentered: {
    textAlign: "center",
  },

  // ─── Benefit list ───
  benefits: {
    width: "100%",
    marginTop: 46,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: NL.hairline,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 32,
    rowGap: 20,
  },
  benefitsColumn: {
    flexDirection: "column",
    rowGap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitItemWide: {
    width: "44%",
  },
  benefitMarker: {
    width: 22,
    alignItems: "center",
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: 20,
    color: NL.inkSoft,
  },

  // ─── Subscribed extras ───
  unsubscribeBlock: {
    width: "100%",
    marginTop: 40,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: NL.hairline,
  },
  unsubscribeLabel: {
    fontFamily: INTER,
    fontSize: 13.5,
    color: NL.muted,
    marginBottom: 10,
  },
  unsubscribeLabelCentered: {
    textAlign: "center",
  },
  unsubscribeButton: {
    alignSelf: "flex-start",
  },
  unsubscribeButtonCentered: {
    alignSelf: "center",
  },
  unsubscribeButtonText: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: "600",
    color: NL.ink,
    textDecorationLine: "underline",
  },
});
