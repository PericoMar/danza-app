import React from "react";
import { View, Text, Pressable } from "react-native";
import { SANS } from "@/theme/landing";
import { siteStyles } from "@/components/common/siteStyles";
import { Colors } from "@/theme/colors";
import { Page, SectionHeader } from "./HomeSection";
import { homeStyles as styles, formatStat } from "./homeStyles";
import type { PlatformStats } from "@/hooks/useStats";

type Props = {
  pageH: number;
  pH: number;
  maxW: number;
  titleSize: number;
  statSize: number;
  stats: PlatformStats | undefined;
  onExplore: () => void;
};

export default function CompaniesSection({
  pageH,
  pH,
  maxW,
  titleSize,
  statSize,
  stats,
  onExplore,
}: Props) {
  const cards = [
    {
      stat: formatStat(stats?.companies),
      label: "Companies listed",
      sub: stats?.countries ? `across ${stats.countries} countries` : "worldwide",
    },
    { stat: formatStat(stats?.auditions), label: "Auditions tracked", sub: "updated daily" },
    { stat: formatStat(stats?.reviews), label: "Community reviews", sub: "from working dancers" },
  ];

  return (
    <Page pageH={pageH} bg={Colors.neutralLight}>
      <View style={[styles.section, { paddingHorizontal: pH }]}>
        <View style={{ maxWidth: maxW, width: "100%" }}>
          <SectionHeader mark="[02]" right="AI-powered directory" />

          <Text
            style={[
              styles.sectionTitle,
              { fontSize: titleSize, lineHeight: Math.round(titleSize * 0.95), fontFamily: SANS },
            ]}
          >
            {"BALLET\nCOMPANIES"}
          </Text>

          <View style={styles.companiesGrid}>
            {cards.map(({ stat, label, sub }) => (
              <View key={label} style={styles.companyStat}>
                <Text
                  style={[
                    styles.companyStatValue,
                    { fontFamily: SANS, fontSize: statSize, lineHeight: statSize * 1.08 },
                  ]}
                >
                  {stat}
                </Text>
                <View style={styles.companyStatRule} />
                <Text style={[styles.companyStatLabel, { fontFamily: SANS }]}>{label}</Text>
                <Text style={[styles.companyStatSub, { fontFamily: SANS }]}>{sub}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.companiesBody, { fontFamily: SANS }]}>
            We analyze community reviews and key facts so you can evaluate any company in minutes —
            salary ranges, repertoire, work conditions, and more.
          </Text>

          <Pressable
            onPress={onExplore}
            style={[siteStyles.btnPrimary, { alignSelf: "flex-start", marginTop: 32 }]}
            accessibilityRole="button"
          >
            <Text style={[siteStyles.btnPrimaryText, { fontFamily: SANS }]}>
              Explore the directory →
            </Text>
          </Pressable>
        </View>
      </View>
    </Page>
  );
}
