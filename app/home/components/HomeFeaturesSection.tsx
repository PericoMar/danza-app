import React from "react";
import { View, Text } from "react-native";
import { SANS, MONO } from "@/theme/landing";
import { Page, SectionHeader } from "./HomeSection";
import { homeStyles as styles, FEATURES } from "./homeStyles";

type Props = {
  pageH: number;
  pH: number;
  maxW: number;
  titleSize: number;
  isLargeScreen: boolean;
};

export default function HomeFeaturesSection({
  pageH,
  pH,
  maxW,
  titleSize,
  isLargeScreen,
}: Props) {
  return (
    <Page pageH={pageH}>
      <View style={[styles.section, { paddingHorizontal: pH }]}>
        <View style={{ maxWidth: maxW, width: "100%" }}>
          <SectionHeader mark="[05]" right="Platform capabilities" />

          <Text
            style={[
              styles.sectionTitle,
              { fontSize: titleSize, lineHeight: Math.round(titleSize * 0.95), fontFamily: SANS },
            ]}
          >
            {"WHAT CAN YOU\nDO HERE?"}
          </Text>

          <View style={[styles.featuresGrid, { flexDirection: isLargeScreen ? "row" : "column" }]}>
            {FEATURES.map((f) => (
              <View key={f.mark} style={[styles.featureItem, isLargeScreen && { flex: 1 }]}>
                <Text style={[styles.featureMark, { fontFamily: MONO }]}>[{f.mark}]</Text>
                <Text style={[styles.featureTitle, { fontFamily: SANS }]}>{f.title}</Text>
                <View style={styles.featureRule} />
                <Text style={[styles.featureBody, { fontFamily: SANS }]}>{f.body}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Page>
  );
}
