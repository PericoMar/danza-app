import React from "react";
import { View, Text, Pressable } from "react-native";
import { SANS, MONO } from "@/theme/landing";
import { siteStyles } from "@/components/common/siteStyles";
import type { AuditionListItem } from "@/types/audition";
import { Page, SectionHeader } from "./HomeSection";
import { homeStyles as styles } from "./homeStyles";

type Props = {
  pageH: number;
  pH: number;
  maxW: number;
  titleSize: number;
  auditions: AuditionListItem[];
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
              auditions.map((a) => (
                <View key={a.id} style={styles.auditionRow}>
                  <View style={styles.auditionRowLeft}>
                    <Text style={[styles.auditionCompany, { fontFamily: SANS }]}>
                      {a.company_name}
                    </Text>
                    <Text style={[styles.auditionMeta, { fontFamily: SANS }]}>{a.location}</Text>
                  </View>
                  <Text style={[styles.auditionDate, { fontFamily: MONO }]}>
                    {a.audition_date
                      ? new Date(a.audition_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "TBA"}
                  </Text>
                </View>
              ))
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
