import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { INTER } from "@/theme/companies";
import { NL } from "../styles";
import type { PopupTone } from "./types";

type PopupErrorProps = {
  message: string | null;
  tone?: PopupTone;
};

/** The form's error, as a soft tinted banner. Renders nothing without a message. */
export function PopupError({ message, tone = "light" }: PopupErrorProps) {
  if (!message) return null;
  const isDark = tone === "dark";
  const color = isDark ? NL.errorDarkText : NL.errorText;

  return (
    <View
      style={[styles.banner, { backgroundColor: isDark ? NL.errorDarkBg : NL.errorBg }]}
      accessibilityRole="alert"
    >
      <Ionicons name="alert-circle" size={16} color={color} />
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  text: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 13,
  },
});
