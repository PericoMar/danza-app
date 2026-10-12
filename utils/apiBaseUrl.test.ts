import { Platform } from "react-native";
import { getApiBaseUrl } from "./apiBaseUrl";
import {
  ANDROID_EMULATOR_DEV_API_ORIGIN,
  DEV_API_ORIGIN,
  PRODUCTION_API_ORIGIN,
} from "@/constants/api";

// babel-preset-expo inlines process.env.EXPO_PUBLIC_API_BASE at compile time,
// so these tests run with it undefined (as in an EAS build that doesn't set
// it) and can't override it at runtime.
const g = globalThis as unknown as { __DEV__: boolean };

describe("getApiBaseUrl", () => {
  const originalDev = g.__DEV__;

  afterEach(() => {
    g.__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  const setOS = (os: typeof Platform.OS) => jest.replaceProperty(Platform, "OS", os);

  describe("in dev", () => {
    beforeEach(() => {
      g.__DEV__ = true;
    });

    it("uses the local server on iOS and web", () => {
      setOS("ios");
      expect(getApiBaseUrl()).toBe(DEV_API_ORIGIN);
      setOS("web");
      expect(getApiBaseUrl()).toBe(DEV_API_ORIGIN);
    });

    it("uses the emulator alias on Android", () => {
      setOS("android");
      expect(getApiBaseUrl()).toBe(ANDROID_EMULATOR_DEV_API_ORIGIN);
    });
  });

  describe("in production without EXPO_PUBLIC_API_BASE", () => {
    beforeEach(() => {
      g.__DEV__ = false;
    });

    it("falls back to the production site on native", () => {
      setOS("ios");
      expect(getApiBaseUrl()).toBe(PRODUCTION_API_ORIGIN);
      setOS("android");
      expect(getApiBaseUrl()).toBe(PRODUCTION_API_ORIGIN);
    });

    it("calls its own origin on web", () => {
      setOS("web");
      expect(getApiBaseUrl()).toBe("");
    });
  });
});
