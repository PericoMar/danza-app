// components/landing/Footer.tsx
import React from "react";
import { View, Text } from "react-native";
import { Colors } from "../../theme/colors";
import { SPACING } from "../../theme/tokens";

export default function Footer() {
  return (
    <View style={{ alignItems: "center", paddingVertical: SPACING.xl }}>
      <Text style={{ color: Colors.textMuted }}>
        © {new Date().getFullYear()} danza.app
      </Text>
    </View>
  );
}
