import { useWindowDimensions } from "react-native";
import { MOBILE_BREAKPOINT } from "@/constants/layout";

/**
 * Responsive type/size scale for the auth screens (login / register /
 * reset-password). Below MOBILE_BREAKPOINT everything uses Apple's
 * recommended sizes for body text and form controls (17pt input/button text,
 * a 44pt+ tap target) instead of the larger desktop scale — except the
 * headline, which intentionally stays the same large "custom" size on every
 * screen size.
 */
export function useAuthScale() {
  const { width } = useWindowDimensions();
  const isCompact = width <= MOBILE_BREAKPOINT;

  // Same font size as the inputs everywhere — these are all secondary/body
  // copy, so they read as one consistent text size next to the form fields.
  const INPUT_FONT_SIZE = 16;

  return {
    isCompact,
    title: { fontSize: 48 },
    subtitle: { fontSize: INPUT_FONT_SIZE, lineHeight: 22 },
    label: isCompact ? { fontSize: 15 } : { fontSize: 20 },
    body: { fontSize: INPUT_FONT_SIZE, lineHeight: 22 },
    input: { fontSize: INPUT_FONT_SIZE, height: 50 },
    button: isCompact ? { fontSize: 17, height: 50 } : { fontSize: 20, height: 56 },
    bottomText: { fontSize: INPUT_FONT_SIZE },
    errorText: isCompact ? { fontSize: 14 } : { fontSize: 20 },
    logoSize: isCompact ? 72 : 160,
  };
}
