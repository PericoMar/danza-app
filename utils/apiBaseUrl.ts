import { Platform } from "react-native";

// Same dev/prod split already used by services/newsletter and useAiSummary:
// on-device dev builds hit the local Vercel dev server (10.0.2.2 is how the
// Android emulator reaches the host machine's localhost), everything else
// uses the deployed API origin.
export function getApiBaseUrl(): string {
  const DEV_BASE = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
  return __DEV__ ? DEV_BASE : (process.env.EXPO_PUBLIC_API_BASE ?? "");
}
