import React from "react";
import { View, Text } from "react-native";
import { MONO, INK_3 } from "@/theme/landing";
import { Colors } from "@/theme/colors";

interface KickerProps {
  n: string;
  label: string;
}

export default function Kicker({ n, label }: KickerProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: INK_3 }}>
        <Text style={{ color: Colors.text, fontWeight: "500" }}>{n}</Text>
        {"  /  "}{label}
      </Text>
    </View>
  );
}
