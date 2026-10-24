// Size, timing, palette and copy of the og:video. Frames are at FPS.

/** Same frame as public/og-default.png, so the poster and the video line up. */
export const VIDEO_WIDTH = 1200;
export const VIDEO_HEIGHT = 630;
export const FPS = 30;
export const DURATION_IN_FRAMES = 240;

export const CENTER = { x: VIDEO_WIDTH / 2, y: VIDEO_HEIGHT / 2 };

/** When each beat starts. Overlaps are deliberate: every beat begins before the last one ends. */
export const TIMELINE = {
  streamEnd: 72,
  convergeStart: 54,
  convergeDuration: 50,
  /** Extra delay of the tile furthest from the centre when the swirl starts. */
  convergeStagger: 16,
  /** The spin starts this many frames before a tile begins moving inwards. */
  spinLead: 12,
  logoIn: 98,
  logoSettle: 134,
  wordmark: 144,
  words: 162,
  wordStagger: 7,
  tagline: 194,
} as const;

export const SWARM = {
  rows: 4,
  columns: 22,
  tile: 112,
  gap: 22,
  /** How far a row travels left to right, before its speed factor. */
  distance: 1400,
  /** Per-row multiplier on distance, so the rows drift apart. */
  rowSpeeds: [1, 1.15, 0.9, 1.08],
  turns: 2,
  /** How far, in radians, a tile swings around the centre on its way in. */
  swirl: Math.PI * 1.25,
  endScale: 0.08,
} as const;

export const BRAND = {
  logoSize: 220,
  settledLogoSize: 132,
  settledLogoY: 186,
  ringWidth: 6,
} as const;

/** Mirrors theme/colors.tsx, which can't be imported here (it depends on react-native). */
export const PALETTE = {
  bg: "#ffffff",
  text: "#000000",
  grey2: "#666666",
  textLightDark: "#474747",
  silverSoft: "#e2e2e4",
  card: "#f6f6f7",
  chrome: "linear-gradient(168deg,#fdfdfe 0%,#eceef1 22%,#c9ccd2 50%,#e6e8ec 68%,#f8f9fa 88%,#d8dbe1 100%)",
  headline: "linear-gradient(178deg,#6a6f77 0%,#9ba1a9 22%,#c7ccd3 44%,#5b6068 54%,#8b9098 74%,#4e535b 100%)",
  chromeRingShadow:
    "0 1px 0 rgba(255,255,255,.95) inset, 0 -1px 0 rgba(0,0,0,.08) inset, 0 0 0 1px rgba(145,150,160,.45), 0 18px 42px -18px rgba(40,44,55,.35)",
  tileShadow: "0 18px 42px -22px rgba(0,0,0,.18)",
} as const;

export const COPY = {
  wordmark: "danza app",
  words: ["Work", "Dance", "Find", "Audition"],
  tagline: "Every dance audition in one place · danza-app.com",
} as const;
