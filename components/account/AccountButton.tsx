import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { webPointer } from "./styles";

export type AccountButtonVariant = "primary" | "ghost" | "danger";
export type AccountButtonSize = "md" | "sm";

type AccountButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AccountButtonVariant;
  /** "sm" is the slimmer pill used inside the floating save bubble. */
  size?: AccountButtonSize;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to the parent's width (compact layouts). */
  fullWidth?: boolean;
  accessibilityHint?: string;
};

const FOREGROUND: Record<AccountButtonVariant, string> = {
  primary: Colors.white,
  ghost: Colors.text,
  danger: Colors.dangerText,
};

/** Pill button for the account pages: black primary, hairline ghost, soft-red danger. */
export function AccountButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityHint,
}: AccountButtonProps) {
  const color = FOREGROUND[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.base,
        styles[variant],
        size === "sm" && styles.sm,
        fullWidth && styles.fullWidth,
        !isInactive && webPointer,
        hovered && !isInactive && hoverStyles[variant],
        pressed && !isInactive && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === "sm" ? 16 : 17} color={color} /> : null}
          <Text style={[styles.label, size === "sm" && styles.labelSm, { color }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  primary: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "rgba(0,0,0,0.18)",
  },
  danger: {
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.dangerSoft,
  },
  sm: {
    height: 42,
    paddingHorizontal: 18,
    gap: 6,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: "700",
  },
  labelSm: {
    fontSize: 14,
  },
});

const hoverStyles = StyleSheet.create({
  primary: { backgroundColor: Colors.grey1, borderColor: Colors.grey1 },
  ghost: { borderColor: Colors.text },
  danger: { borderColor: Colors.dangerText },
});
