import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { INTER } from "@/theme/companies";
import { NL } from "./styles";

/**
 * Shown on the success screen while the provider is still checking a freshly
 * subscribed address. The person is on the list; what isn't settled yet is
 * whether the address accepts mail — so the screen stays a success and this
 * says the rest in small print rather than contradicting it.
 *
 * `variant` mirrors NewsletterField: "light" on the newsletter page, "dark" on
 * the home alerts section. Same props either way.
 */
export type ValidatingNoticeVariant = "light" | "dark";

type ValidatingNoticeProps = {
  variant?: ValidatingNoticeVariant;
  /** Centers the notice, to match a centered success block on narrow screens. */
  isCentered?: boolean;
};

export function ValidatingNotice({
  variant = "light",
  isCentered = false,
}: ValidatingNoticeProps) {
  const isDark = variant === "dark";
  const tone = isDark
    ? { bg: NL.warnDarkBg, border: NL.warnDarkBorder, text: NL.warnDarkText }
    : { bg: NL.warnBg, border: NL.warnBorder, text: NL.warnText };

  return (
    <View
      style={[
        styles.notice,
        { backgroundColor: tone.bg, borderColor: tone.border },
        isCentered && styles.centered,
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name="time-outline" size={13} color={tone.text} />
      <Text style={[styles.text, { color: tone.text }]}>
        We're still checking your address — alerts start once it's confirmed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    marginTop: 14,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  centered: {
    alignSelf: "center",
  },
  text: {
    fontFamily: INTER,
    fontSize: 11.5,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
