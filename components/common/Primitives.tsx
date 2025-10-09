// components/common/Primitives.tsx
import React from "react";
import { View, Text } from "react-native";
import { Colors } from "../../theme/colors";

export const Row = ({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap }}>{children}</View>
);

export const Spacer = () => <View style={{ flex: 1 }} />;

export const Dot = () => (
  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted }} />
);

export const MutedText = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: Colors.textMuted }}>{children}</Text>
);
