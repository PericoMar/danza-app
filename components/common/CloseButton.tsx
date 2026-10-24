import { Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";

/** "light" on white surfaces, "dark" on near-black ones. */
export type CloseButtonTone = "light" | "dark";
export type CloseButtonSize = "md" | "sm";

type CloseButtonProps = {
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  tone?: CloseButtonTone;
  size?: CloseButtonSize;
  accessibilityLabel?: string;
  /** Where the caller places it; the button itself is position-agnostic. */
  style?: StyleProp<ViewStyle>;
};

const DIAMETER: Record<CloseButtonSize, number> = { md: 30, sm: 24 };
const ICON_SIZE: Record<CloseButtonSize, number> = { md: 20, sm: 16 };

/** Round "×" with a soft hover fill, with a hit area bigger than it looks. */
export function CloseButton({
  onPress,
  onFocus,
  onBlur,
  tone = "light",
  size = "md",
  accessibilityLabel = "Close",
  style,
}: CloseButtonProps) {
  const isDark = tone === "dark";
  const diameter = DIAMETER[size];

  return (
    <Pressable
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.button,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
        Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        hovered && (isDark ? styles.hoveredDark : styles.hovered),
        style,
      ]}
    >
      <Ionicons
        name="close"
        size={ICON_SIZE[size]}
        color={isDark ? "rgba(255,255,255,0.6)" : Colors.grey2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  hovered: {
    backgroundColor: Colors.rule,
  },
  hoveredDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
