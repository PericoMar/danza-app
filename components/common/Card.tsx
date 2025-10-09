// components/common/Card.tsx
import React from "react";
import { ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../theme/colors";
import { GRADIENT_SURFACE, RADIUS } from "../../theme/tokens";

type Props = { children: React.ReactNode; style?: ViewStyle };

export default function Card({ children, style }: Props) {
  return (
    <LinearGradient colors={GRADIENT_SURFACE} style={[{
      borderRadius: RADIUS,
      padding: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      flex: 1,
      maxWidth: 530,
    }, style]}>
      {children}
    </LinearGradient>
  );
}
