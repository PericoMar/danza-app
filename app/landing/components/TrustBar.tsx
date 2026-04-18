import React from "react";
import { View, Text } from "react-native";
import { MONO, INK_3, RULE, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";

interface TrustBarProps {
  width: number;
}

const STATS = [
  { bold: "240+", label: " Companies" },
  { bold: "520+", label: " Open Auditions" },
  { bold: null, label: "Weekly Alerts" },
  { bold: null, label: "Free for everyone" },
];

export default function TrustBar({ width }: TrustBarProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: RULE, borderBottomWidth: 1, borderBottomColor: RULE, paddingVertical: 18, paddingHorizontal: pH }}>
      <View
        style={{
          maxWidth: wrap(width),
          alignSelf: "center",
          width: "100%",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 12 : 36,
        }}
      >
        {STATS.map(({ bold, label }, i) => (
          <Text key={i} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: INK_3 }}>
            {bold ? <Text style={{ color: Colors.text, fontWeight: "500" }}>{bold}</Text> : null}
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
