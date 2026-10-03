// components/landing/StatsSection.tsx
// Section [02] — platform numbers, fetched from Supabase
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { SANS, MONO, INK_3, RULE, RULE_STRONG, wrap, hPad } from "@/theme/landing";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import { Colors } from "@/theme/colors";
import { useStats } from "@/hooks/useStats";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function StatsSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);
  const numSize = Math.max(28, Math.min(88, Math.floor(width / 10.5)));
  const numLetterSpacing = numSize > 50 ? -2 : -0.5;
  const vertPad = isMobile ? 40 : 64;
  const headerMargin = isMobile ? 40 : 72;
  const footerMargin = isMobile ? 40 : 72;

  const { data: stats } = useStats();

  const STATS = [
    {
      value: stats ? formatCount(stats.auditions) : "—",
      label: "Auditions\nregistered on\nthe platform",
    },
    {
      value: stats ? formatCount(stats.companies) : "—",
      label: "Dance companies\nregistered on\nthe platform",
    },
    {
      value: stats ? formatCount(stats.countries) : "—",
      label: "Countries\nrepresented across\nthe directory",
    },
  ];

  return (
    <View style={[styles.outer, { paddingHorizontal: pH, paddingVertical: vertPad }]}>
      <View style={[styles.inner, { maxWidth: wrap(width) }]}>
        {/* Header row ── [02] / tagline */}
        <View style={[styles.headerRow, { marginBottom: headerMargin }]}>
          <Text style={[styles.mark, { fontFamily: MONO }]}>[02]</Text>
          <Text style={[styles.tagline, { fontFamily: SANS }]}>
            The global ballet community in numbers
          </Text>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
          {STATS.map(({ value, label }) => (
            <View key={label} style={styles.statCol}>
              <Text
                style={[
                  styles.statValue,
                  {
                    fontFamily: SANS,
                    fontSize: numSize,
                    lineHeight: numSize * 1.05,
                    letterSpacing: numLetterSpacing,
                  },
                ]}
              >
                {value}
              </Text>
              <View style={styles.statRule} />
              <Text style={[styles.statLabel, { fontFamily: SANS }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Footer bar */}
        <View style={[styles.footerBar, { marginTop: footerMargin }]}>
          <Text style={[styles.footerLeft, { fontFamily: SANS }]}>
            Real-time platform metrics
          </Text>
          <Text style={[styles.footerRight, { fontFamily: MONO }]}>
            UPDATED DAILY
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  inner: {
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mark: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: INK_3,
  },
  tagline: {
    fontSize: 12,
    color: INK_3,
    letterSpacing: 0.2,
    textAlign: "right",
    maxWidth: 220,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 0,
  },
  statsRowMobile: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 12,
  },
  statValue: {
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  statRule: {
    width: 28,
    height: 1,
    backgroundColor: RULE_STRONG,
  },
  statLabel: {
    fontSize: 13,
    color: INK_3,
    textAlign: "center",
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  footerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  footerLeft: {
    fontSize: 11,
    color: INK_3,
    letterSpacing: 0.4,
  },
  footerRight: {
    fontSize: 10,
    color: INK_3,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
