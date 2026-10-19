import { Platform, StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";
import { INK_3, RULE, RULE_STRONG } from "@/theme/landing";

// ─── Layout constants ────────────────────────────────────────────────────────
export const NAVBAR_H = 72;

/** Near-black backdrop for the "never miss an audition" section. */
export const ALERTS_BG = "#0a0a0a";

// ─── Type-scale helpers ──────────────────────────────────────────────────────
export const heroFontSize = (width: number, isMobile: boolean) =>
  isMobile ? 56 : Math.min(96, Math.max(64, width * 0.065));

export const sectionFontSize = (width: number) =>
  Math.min(80, Math.max(44, width * 0.055));

export function formatStat(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ─── Feature items ("what can you do here?") ──────────────────────────────────
export const FEATURES = [
  {
    mark: "01",
    title: "Search & compare",
    body: "Filter by country, company type, salary estimates and dancer satisfaction.",
  },
  {
    mark: "02",
    title: "AI summaries",
    body: "Pros and cons distilled from real reviews so you can decide in 20 seconds.",
  },
  {
    mark: "03",
    title: "Audition alerts",
    body: "Get notified the moment new auditions match your interests and deadlines.",
  },
  {
    mark: "04",
    title: "Favourites",
    body: "Save companies you're watching for quick access and comparison later.",
  },
];

// ─── Section-header row ───────────────────────────────────────────────────────
export const sectionHeaderStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  sectionMark: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: INK_3,
  },
  sectionRight: {
    fontSize: 11,
    color: INK_3,
    letterSpacing: 0.3,
  },
});

// ─── Screen styles ───────────────────────────────────────────────────────────
export const homeStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scrollContainer: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  heroSection: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: "center",
    overflow: "visible",
  },
  heroInner: {
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    gap: 16,
    flex: 1,
    overflow: "visible",
  },
  heroCopy: {
    gap: 24,
    justifyContent: "center",
    paddingVertical: 24,
    // zIndex 3 > globeWrap's 2: text/buttons paint on top of the globe that
    // bleeds into this column, keeping them readable and clickable.
    position: "relative",
    zIndex: 3,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionMark: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: INK_3,
  },
  taglineSmall: {
    flex: 1,
    fontSize: 12,
    color: INK_3,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -1,
  },
  globeWrap: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  taglineDesktop: {
    position: "absolute",
    top: 0,
    right: 0,
    fontSize: 12,
    color: INK_3,
    textAlign: "right",
    maxWidth: 220,
    zIndex: 1,
    letterSpacing: 0.2,
  },
  globeHint: {
    fontSize: 11,
    color: INK_3,
    letterSpacing: 0.4,
    marginTop: 8,
  },
  exploreBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(120,124,132,0.75)",
    ...(Platform.OS === "web"
      ? ({
          background:
            "linear-gradient(180deg, #eef0f2 0%, #c3c6cc 34%, #8b8f98 50%, #a9adb5 62%, #d3d6db 100%)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.85) inset, 0 -2px 3px rgba(0,0,0,0.22) inset, 0 6px 18px rgba(30,30,40,0.22)",
        } as object)
      : {
          backgroundColor: "#a9adb5",
          shadowColor: "#1e1e28",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 4,
        }),
  },
  exploreBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b1b1f",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    ...(Platform.OS === "web"
      ? ({ textShadow: "0 1px 0 rgba(255,255,255,0.6)" } as object)
      : null),
  },

  // Generic section layout
  section: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  sectionTitle: {
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 40,
  },

  // Auditions section
  auditionList: {
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  auditionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    gap: 16,
  },
  auditionRowLeft: {
    flex: 1,
    gap: 2,
  },
  auditionCompany: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  auditionMeta: {
    fontSize: 12,
    color: INK_3,
    letterSpacing: 0.2,
  },
  auditionDate: {
    fontSize: 12,
    color: INK_3,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  muted: {
    fontSize: 14,
    color: INK_3,
    paddingVertical: 24,
  },

  // Companies section
  companiesGrid: {
    flexDirection: "row",
    gap: 0,
    marginBottom: 32,
    borderTopWidth: 1,
    borderTopColor: RULE_STRONG,
    paddingTop: 32,
  },
  companyStat: {
    flex: 1,
    paddingRight: 24,
    gap: 6,
  },
  companyStatValue: {
    fontSize: 52,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -2,
    lineHeight: 56,
  },
  companyStatRule: {
    width: 24,
    height: 1,
    backgroundColor: RULE_STRONG,
    marginVertical: 4,
  },
  companyStatLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: 0.1,
  },
  companyStatSub: {
    fontSize: 11,
    color: INK_3,
    letterSpacing: 0.2,
  },
  companiesBody: {
    fontSize: 15,
    color: INK_3,
    lineHeight: 24,
    maxWidth: 580,
    letterSpacing: 0.1,
  },

  // Features section
  featuresGrid: {
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  featureItem: {
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    gap: 8,
  },
  featureMark: {
    fontSize: 10,
    letterSpacing: 2,
    color: INK_3,
    textTransform: "uppercase",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  featureRule: {
    width: 20,
    height: 1,
    backgroundColor: RULE_STRONG,
    marginVertical: 2,
  },
  featureBody: {
    fontSize: 13,
    color: INK_3,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Alerts section
  alertsBody: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 24,
    maxWidth: 480,
    letterSpacing: 0.1,
    marginBottom: 36,
  },
  // Newsletter success panel
  successPanelFrame: {
    maxWidth: 520,
    alignSelf: "flex-start",
  },
  successPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  successCopy: {
    flex: 1,
    gap: 4,
  },
  successTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  successBody: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.1,
  },
});
