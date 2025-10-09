// components/common/PillButton.tsx
import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import { Colors } from "../../theme/colors";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "black";
  style?: ViewStyle;
};

export default function PillButton({ label, onPress, variant = "primary", style }: Props) {
  const base = {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  } as const;

  const styleVariant =
    variant === "primary"
      ? { backgroundColor: Colors.purpleSoft, borderColor: Colors.purpleSoft }
      : variant === "black"
      ? { backgroundColor: Colors.text, borderColor: Colors.bg, color: Colors.bg }
      : { backgroundColor: "transparent", borderColor: Colors.border };

  return (
    <Pressable onPress={onPress} style={[base, styleVariant, style]}>
      <Text style={{ color: styleVariant.color, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
