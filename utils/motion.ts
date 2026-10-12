import { Platform } from "react-native";

/** True when the browser asks for reduced motion. Always false on native. */
export function prefersReducedMotion(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
