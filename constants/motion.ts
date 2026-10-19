// Shared micro-interaction timings, so every control that gives touch/hover
// feedback moves the same way.

// Press: the control dips while held and springs back on release.
export const PRESS_SCALE = 0.97;
export const PRESS_SPRING = { speed: 40, bounciness: 6 } as const;

// Hover (web): fills and borders fade over a short CSS transition.
export const HOVER_TRANSITION_MS = 160;
