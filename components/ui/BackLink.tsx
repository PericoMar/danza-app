import React from "react";
import { Text, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";

const WEB_POINTER = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

type Props = {
  /** Where to go when there is no history to return to, e.g. a direct visit. */
  fallbackHref: Href;
  label?: string;
  /** What a screen reader says; defaults to "Go back". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Discreet "‹ Back" link: returns to the previous screen, or to `fallbackHref`. */
export default function BackLink({
  fallbackHref,
  label = "Back",
  accessibilityLabel = "Go back",
  style,
}: Props) {
  const router = useRouter();

  const goBack = () => (router.canGoBack() ? router.back() : router.navigate(fallbackHref));

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[styles.back, WEB_POINTER, style]}
    >
      {({ hovered }) => {
        const color = hovered ? Colors.text : Colors.grey2;
        return (
          <>
            <Ionicons name="chevron-back" size={14} color={color} />
            <Text style={[styles.backText, { color }]}>{label}</Text>
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },
  backText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "500",
  },
});
