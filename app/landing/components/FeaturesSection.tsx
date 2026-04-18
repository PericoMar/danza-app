import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SERIF, SANS, INK_2, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import Kicker from "./Kicker";
import SectionTitle from "./SectionTitle";

interface FeaturesSectionProps {
  width: number;
}

const FEATURES = [
  {
    num: "i.",
    icon: "calendar-outline" as const,
    title: "Audition\nDirectory",
    desc: "Browse open calls from hundreds of ballet companies worldwide — filtered by city, contract, style, or season.",
  },
  {
    num: "ii.",
    icon: "mail-outline" as const,
    title: "Audition\nAlerts",
    desc: "Subscribe once. Receive a single, carefully curated email of the week's new auditions. No noise. No resends.",
  },
  {
    num: "iii.",
    icon: "heart-outline" as const,
    title: "A Private\nFavorites List",
    desc: "Save auditions that matter to you. Track deadlines, preparation notes, and submission status — quietly, privately.",
  },
];

function FeatureCard({ num, icon, title, desc }: typeof FEATURES[0]) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 240,
        backgroundColor: Colors.purpleLight,
        borderRadius: 4,
        padding: 44,
        minHeight: 380,
        justifyContent: "flex-start",
      }}
    >
      <Text style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: "400", fontSize: 26, color: Colors.text, opacity: 0.55, marginBottom: "auto" }}>
        {num}
      </Text>
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Ionicons name={icon} size={40} color={Colors.text} />
      </View>
      <Text style={{ fontFamily: SERIF, fontWeight: "400", fontSize: 32, lineHeight: 34, color: Colors.text, marginBottom: 12 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: SANS, color: INK_2, fontSize: 15, lineHeight: 24 }}>
        {desc}
      </Text>
    </View>
  );
}

export default function FeaturesSection({ width }: FeaturesSectionProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);

  return (
    <View style={{ paddingHorizontal: pH, paddingVertical: isMobile ? 80 : 120 }}>
      <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%", gap: 64 }}>
        <View
          style={{
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            gap: 32,
          }}
        >
          <View style={{ flex: 1 }}>
            <Kicker n="01" label="What Danza offers" />
            <SectionTitle>
              A quieter way to{"\n"}find your{" "}
              <Text style={{ fontStyle: "italic" }}>next stage.</Text>
            </SectionTitle>
          </View>
          {!isMobile && (
            <View style={{ maxWidth: 360, paddingBottom: 8 }}>
              <Text style={{ fontFamily: SANS, fontSize: 16, color: INK_2, lineHeight: 26 }}>
                Three tools, carefully made. Designed for the rhythm of a dancer's life and the realities of running a company.
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: isMobile ? "column" : "row", gap: 16 }}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.num} {...f} />
          ))}
        </View>
      </View>
    </View>
  );
}
