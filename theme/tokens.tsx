// theme/tokens.ts
import { Colors } from "./colors";

export const BREAKPOINT = 700; // px
export const RADIUS = 24;

export const GRADIENT_SURFACE = [Colors.gray2, Colors.gray1] as const;
export const GRADIENT_TILE = [Colors.surface, Colors.surfaceAlt] as const;

export const SPACING = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const TYPO = {
  h1: { fontSize: 28, fontWeight: "800" as const, letterSpacing: 0.3 },
  h2: { fontSize: 22, fontWeight: "800" as const },
  body: { fontSize: 16, lineHeight: 22 },
  caption: { fontSize: 13 },
};
