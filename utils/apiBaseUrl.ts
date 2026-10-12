import { Platform } from "react-native";
import {
  ANDROID_EMULATOR_DEV_API_ORIGIN,
  DEV_API_ORIGIN,
  PRODUCTION_API_ORIGIN,
} from "@/constants/api";

// Base URL for calls to the Vercel functions under /api:
// - dev builds hit the local Vercel dev server;
// - EXPO_PUBLIC_API_BASE wins when it's set;
// - web otherwise calls its own origin (""), so each Vercel preview talks to
//   its own functions;
// - native otherwise uses the production site. An empty base there turns
//   "/api/..." into a relative URL, which fetch can't resolve on a device.
export function getApiBaseUrl(): string {
  if (__DEV__) {
    return Platform.OS === "android" ? ANDROID_EMULATOR_DEV_API_ORIGIN : DEV_API_ORIGIN;
  }
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv;
  return Platform.OS === "web" ? "" : PRODUCTION_API_ORIGIN;
}
