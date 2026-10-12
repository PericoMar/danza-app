// Origins for the Vercel functions under /api. Read them through
// getApiBaseUrl() (utils/apiBaseUrl.ts), not directly.

// Production site. Native builds have no "same origin" to fall back on, so
// they use this when EAS doesn't define EXPO_PUBLIC_API_BASE.
export const PRODUCTION_API_ORIGIN = "https://danza-app.com";

// Local `vercel dev` server. The Android emulator reaches the host machine's
// localhost through 10.0.2.2.
export const DEV_API_ORIGIN = "http://localhost:3000";
export const ANDROID_EMULATOR_DEV_API_ORIGIN = "http://10.0.2.2:3000";
