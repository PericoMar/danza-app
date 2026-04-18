import React from "react";
import { View, Text } from "react-native";
import { SERIF, SANS, INK_2, INK_3, RULE, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import Kicker from "./Kicker";
import SectionTitle from "./SectionTitle";

interface HowItWorksSectionProps {
  width: number;
}

const STEPS = [
  {
    num: "01",
    title: "Browse the directory.",
    desc: "Search hundreds of companies and active calls. Filter by country, contract length, or audition window.",
  },
  {
    num: "02",
    title: "Save your favorites.",
    desc: "Bookmark calls you want to pursue. Keep deadlines, requirements, and your own notes in one quiet place.",
  },
  {
    num: "03",
    title: "Receive weekly alerts.",
    desc: "Every Sunday, a single email with the week's new auditions. Unsubscribe any time. Always free.",
  },
];

function StepBlock({ num, title, desc, hasBorderLeft }: typeof STEPS[0] & { hasBorderLeft: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: 44,
        paddingBottom: 44,
        paddingRight: 44,
        paddingLeft: hasBorderLeft ? 44 : 0,
        borderTopWidth: 1,
        borderTopColor: RULE,
        borderBottomWidth: 1,
        borderBottomColor: RULE,
        borderLeftWidth: hasBorderLeft ? 1 : 0,
        borderLeftColor: RULE,
        minWidth: 200,
      }}
    >
      <Text
        style={{
          fontFamily: SERIF,
          fontWeight: "300",
          fontSize: 80,
          lineHeight: 80,
          letterSpacing: -2,
          color: Colors.text,
          marginBottom: 24,
        }}
      >
        {num}
        <Text style={{ fontSize: 18, fontStyle: "italic", color: INK_3 }}> i</Text>
      </Text>
      <Text style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: "400", fontSize: 24, lineHeight: 28, color: Colors.text, marginBottom: 10 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: SANS, color: INK_2, fontSize: 15, lineHeight: 24 }}>
        {desc}
      </Text>
    </View>
  );
}

export default function HowItWorksSection({ width }: HowItWorksSectionProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);

  return (
    <View style={{ paddingHorizontal: pH, paddingBottom: isMobile ? 80 : 120 }}>
      <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%" }}>
        <View style={{ marginBottom: 48 }}>
          <Kicker n="02" label="How it works" />
          <SectionTitle>
            Three steps,{"\n"}
            <Text style={{ fontStyle: "italic" }}>no friction.</Text>
          </SectionTitle>
        </View>
        <View style={{ flexDirection: isMobile ? "column" : "row" }}>
          {STEPS.map((s, i) => (
            <StepBlock key={s.num} {...s} hasBorderLeft={!isMobile && i > 0} />
          ))}
        </View>
      </View>
    </View>
  );
}
