import { Platform, StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";

// The account pages (/profile, /profile/delete-account) borrow the newsletter's
// editorial look: stark black-on-white, one oversized headline, hairline-ruled
// blocks, pill buttons. No accent colour beyond the soft danger tint.

/** Oversized page headline, scaled to the viewport like the newsletter hero. */
export function accountTitleSize(width: number, isWide: boolean): number {
  return isWide
    ? Math.max(52, Math.min(Math.round(width * 0.068), 88))
    : Math.max(40, Math.min(Math.round(width * 0.12), 52));
}

export const accountStyles = StyleSheet.create({
  // ─── Screen shell ───
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  scroll: {
    flexGrow: 1,
  },
  /** Padded area above the footer; grows so the footer sits at the bottom on short pages. */
  shell: {
    flexGrow: 1,
  },
  page: {
    flexGrow: 1,
    width: "100%",
    alignSelf: "center",
  },

  // ─── Shared text ───
  bodyText: {
    fontFamily: INTER,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textLightDark,
  },
  hintText: {
    fontFamily: INTER,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: INTER,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.dangerText,
  },
});

/** Web-only pointer cursor; empty on native. */
export const webPointer = Platform.select({
  web: { cursor: "pointer" } as object,
  default: {},
});
