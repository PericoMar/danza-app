import React from "react";
import { Text } from "react-native";
import { SERIF } from "@/theme/landing";
import { Colors } from "@/theme/colors";

interface SectionTitleProps {
  children: React.ReactNode;
}

export default function SectionTitle({ children }: SectionTitleProps) {
  return (
    <Text
      style={{
        fontFamily: SERIF,
        fontWeight: "400",
        fontSize: 52,
        lineHeight: 52,
        letterSpacing: -0.5,
        color: Colors.text,
        marginBottom: 0,
      }}
    >
      {children}
    </Text>
  );
}
