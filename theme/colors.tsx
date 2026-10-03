// theme/colors.ts
// Design tokens as TypeScript constants (RN "variables")
export const Colors = {
  bg: "#ffffffff",
  white: "#ffffff",
  surface: "#ffffffff",
  surfaceAlt: "#ece6f9ff",
  text: "#000000ff",
  textLightDark: "#474747cc",
  textMuted: "#929294ff",
  border: "rgba(255,255,255,0.08)",
  // Purple accents to experiment with
  purple: "#7755FF",
  purpleDark: "#5A3EEA",
  purpleSoft: "#A98CFF",
  purpleLight: "#f3f1feff",
  // Grays for subtle gradients
  gray1: "#1A1A1D",
  gray2: "#101012",
  auditionBgColor: '#f3f1feff',

  // ─── Companies page (Claude Design "Companies.html") ───
  // Neutral surfaces
  neutralLight: "#f5f5f6",   // section tint (distinct from purple-tinted purpleLight)
  card: "#f6f6f7",           // card logo panel
  silver: "#C0C0C0",         // hairline dividers on the companies page
  silverSoft: "#e2e2e4",     // card border
  grey1: "#333333",          // strong muted text
  grey2: "#666666",          // eyebrow / mono labels
  dark2: "#1A1A1D",
  rule: "rgba(0,0,0,0.08)",
  ruleStrong: "rgba(0,0,0,0.14)",
  // Audition status dots
  auditionOpen: "#3ddc91",
  auditionSoon: "#ffd66b",
  auditionClosed: "#9b9ba1",
  // Favorite heart (active state)
  heartRed: "#ff5151",

  // ─── Company Insights page (Claude Design "Company Insights v3.html") ───
  // Base surfaces stay silver/chrome (tokens above). Pink is accent-only:
  // audition frame tint, status/lock pills, AI avatar, in-text links.
  pink: "#E0447B",
  pinkDark: "#BC2F60",
  pinkSoft: "#F0AEC7",
  pinkTint: "#FDF1F5",        // audition frame background (light pink)
  pinkBorder: "#F4D3E0",      // borders of pills/boxes sitting on pinkTint
  // Audition status pill — logged-in / accepting applications
  auditionOpenBg: "#EFF8F2",
  auditionOpenText: "#1C7A4E",
  auditionOpenBorder: "#CDE9DA",
  // Neutrals specific to the insights layout
  panelBorder: "#DCDCE0",     // white audition frame border
  specSurface: "#FAFAFB",     // spec cells / soft rows
  specDivider: "#E6E6EA",     // 1px grid lines + guest redaction bars
  skeletonFill: "#e7e7ea",    // shimmer blocks
  chromeSoft: "#F5F5F7",      // chrome-soft button/avatar fill
  // Admin action buttons
  dangerSoft: "#fadddd",     // "Delete company" button fill
  // "You have already reviewed this company" banner (green)
  successBg: "#F0FDF4",
  successBorder: "#bbf0cf",
  successText: "#14532d",
} as const;

// Metallic "chrome" gradients used on the companies page (hero CTA, monogram,
// date trigger, card audition strip). Consumed by expo-linear-gradient.
export const Gradients = {
  chrome: {
    colors: ["#fdfdfe", "#eceef1", "#c9ccd2", "#e6e8ec", "#f8f9fa", "#d8dbe1"],
    locations: [0, 0.22, 0.5, 0.68, 0.88, 1],
  },
  chromeSoft: {
    colors: ["#fdfdfe", "#eceef1", "#d8dbe1"],
    locations: [0, 0.45, 1],
  },
  darkPill: {
    colors: ["#3a3d44", "#191b1f", "#2c2f35"],
    locations: [0, 0.6, 1],
  },
  // Near-vertical silver sheen for the emphasised headline line
  headline: {
    colors: ["#6a6f77", "#9ba1a9", "#c7ccd3", "#5b6068", "#8b9098", "#4e535b"],
    locations: [0, 0.22, 0.44, 0.54, 0.74, 1],
    css: "linear-gradient(178deg,#6a6f77 0%,#9ba1a9 22%,#c7ccd3 44%,#5b6068 54%,#8b9098 74%,#4e535b 100%)",
  },
} as const;