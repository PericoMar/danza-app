import React from "react";
import { View, Text, Pressable } from "react-native";
import { SANS, MONO } from "@/theme/landing";
import { siteStyles } from "@/components/common/siteStyles";
import type { AuditionWithCompany } from "@/types/audition";
import { formatDateRange, getHeadlineAuditionDate, getPlacesSummary } from "@/utils/auditionDisplay";
import { Page, SectionHeader } from "./HomeSection";
import { homeStyles as styles } from "./homeStyles";

type Props = {
  pageH: number;
  pH: number;
  maxW: number;
  titleSize: number;
  auditions: AuditionWithCompany[];
  loading: boolean;
  onBrowseAll: () => void;
};

export default function AuditionsSection({
  pageH,
  pH,
  maxW,
  titleSize,
  auditions,
  loading,
  onBrowseAll,
}: Props) {
  return (
    <Page pageH={pageH}>
      <View style={[styles.section, { paddingHorizontal: pH }]}>
        <View style={{ maxWidth: maxW, width: "100%" }}>
          <SectionHeader mark="[04]" right="Real-time listings" />

          <Text
            style={[
              styles.sectionTitle,
              { fontSize: titleSize, lineHeight: Math.round(titleSize * 0.95), fontFamily: SANS },
            ]}
          >
            {"UPCOMING\nAUDITIONS"}
          </Text>

          <View style={styles.auditionList}>
            {loading && auditions.length === 0 ? (
              <Text style={[styles.muted, { fontFamily: SANS }]}>Loading…</Text>
            ) : auditions.length === 0 ? (
              <Text style={[styles.muted, { fontFamily: SANS }]}>
                No upcoming auditions at the moment.
              </Text>
            ) : (
              auditions.map((a) => {
                const next = getHeadlineAuditionDate(a);
                return (
                <View key={a.id} style={styles.auditionRow}>
                  <View style={styles.auditionRowLeft}>
                    <Text style={[styles.auditionCompany, { fontFamily: SANS }]}>
                      {a.company_name}
                    </Text>
                    <Text style={[styles.auditionMeta, { fontFamily: SANS }]}>{getPlacesSummary(a)}</Text>
                  </View>
                  <Text style={[styles.auditionDate, { fontFamily: MONO }]}>
                    {!next ? "TBA" : next.date_label ?? formatDateRange(next.start_date, next.end_date)}
                  </Text>
                </View>
                );
              })
            )}
          </View>

          <Pressable
            onPress={onBrowseAll}
            style={[siteStyles.btnGhost, { alignSelf: "flex-start", marginTop: 32 }]}
            accessibilityRole="button"
          >
            <Text style={[siteStyles.btnGhostText, { fontFamily: SANS }]}>
              Browse all auditions →
            </Text>
          </Pressable>
        </View>
      </View>
    </Page>
  );
}
