import { Text, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { INTER } from "@/theme/companies";
import { NL } from "./styles";
import type { NewsletterFieldVariant } from "./NewsletterField";

interface EmailSuggestionProps {
  /** The corrected address, from `suggestEmailFix`. */
  suggestion: string;
  /** Takes the correction and subscribes with it, in one tap. */
  onAccept: () => void;
  variant: NewsletterFieldVariant;
}

/**
 * "Did you mean …?" under an email field. Asking beats sending: an address with
 * a typo in the domain is accepted by the provider and then bounces forever.
 * One tap fixes it and goes on, so a correct address never sees this.
 */
export function EmailSuggestion({ suggestion, onAccept, variant }: EmailSuggestionProps) {
  const isDark = variant === "dark";
  const color = isDark ? "rgba(255,255,255,0.75)" : NL.muted;

  return (
    <Pressable
      onPress={onAccept}
      accessibilityRole="button"
      accessibilityLabel={`Use ${suggestion}`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="help-circle-outline" size={15} color={color} />
      <Text style={[styles.text, { color }]}>
        Did you mean{" "}
        <Text style={[styles.email, isDark && styles.emailDark]}>{suggestion}</Text>?
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  text: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: 18,
  },
  email: {
    fontWeight: "700",
    color: NL.ink,
    textDecorationLine: "underline",
  },
  emailDark: {
    color: "#fff",
  },
});
