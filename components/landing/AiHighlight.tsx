import React from "react";
import { View, Text } from "react-native";
import { Colors } from "@/theme/colors";
import { SPACING } from "@/theme/tokens";
import { FontAwesome6 } from "@expo/vector-icons";
import { MutedText } from "../common/Primitives";

export default function AIHighlight() {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel="Módulo de IA. Resúmenes inteligentes en segundos."
      style={{
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 16,
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: "center", alignItems: "center", gap: 8 }} >
        <FontAwesome6 name="clock" size={24} color="black" />
        <Text
          style={{
            fontSize: 36,
            fontWeight: "900",
            letterSpacing: 2,
            color: Colors.text,
            textTransform: "uppercase",
          }}
        >
          AI
        </Text>
      </View>
      <MutedText>See what matters, instantly, with AI</MutedText>
    </View>
  );
}
