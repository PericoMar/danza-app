import type { TextInputProps } from "react-native";

/**
 * The behaviour every popup's email input shares, whatever it looks like:
 * email keyboard, no autocorrect, browser autofill, "go" submits.
 */
export const POPUP_EMAIL_INPUT_PROPS = {
  keyboardType: "email-address",
  inputMode: "email",
  autoCapitalize: "none",
  autoCorrect: false,
  autoComplete: "email",
  returnKeyType: "go",
  accessibilityLabel: "Email address",
} as const satisfies TextInputProps;

export const POPUP_EMAIL_PLACEHOLDER = "name@email.com";
