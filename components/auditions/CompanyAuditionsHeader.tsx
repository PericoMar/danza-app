// components/auditions/CompanyAuditionsHeader.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FeaturedAuditionTag from "@/components/auditions/FeaturedAuditionTag";
import { siteStyles } from "@/components/common/siteStyles";
import { Colors } from "@/theme/colors";
import { DISPLAY, INTER } from "@/theme/companies";

const TITLE_MIN = 26;
const TITLE_MAX = 40;
const WEB_POINTER = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

type Props = {
  companyName: string;
  auditionCount: number;
  onBack: () => void;
  onCreate: () => void;
};

/** Admin auditions list heading: breadcrumb, title, primary CTA and the "Featured" legend. */
export default function CompanyAuditionsHeader({
  companyName,
  auditionCount,
  onBack,
  onCreate,
}: Props) {
  const { width } = useWindowDimensions();
  const titleSize = Math.max(TITLE_MIN, Math.min(TITLE_MAX, width * 0.04));

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onBack}
        accessibilityRole="link"
        accessibilityLabel={`Back to ${companyName}`}
        style={({ hovered }) => [styles.back, WEB_POINTER, hovered && styles.backHovered]}
      >
        <Ionicons name="chevron-back" size={14} color={Colors.grey2} />
        <Text style={styles.backText} numberOfLines={1}>
          {companyName}
        </Text>
      </Pressable>

      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Admin · Manage auditions</Text>
          <Text
            style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.05 }]}
            accessibilityRole="header"
          >
            {companyName} <Text style={styles.titleMuted}>auditions</Text>
          </Text>
        </View>

        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          style={({ hovered }) => [siteStyles.btnPrimary, WEB_POINTER, hovered && styles.ctaHovered]}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={siteStyles.btnPrimaryText}>New audition</Text>
        </Pressable>
      </View>

      {auditionCount > 0 && (
        <>
          <View style={styles.note}>
            <FeaturedAuditionTag />
            <Text style={styles.noteText}>
              is the audition dancers see on the company card and page. It's picked automatically:
              open calls first, then the nearest deadline.
            </Text>
          </View>

          <Text style={styles.count}>
            {auditionCount} {auditionCount === 1 ? "audition" : "auditions"}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 28,
    paddingBottom: 18,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 22,
    opacity: 0.85,
  },
  backHovered: {
    opacity: 1,
  },
  backText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.grey2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
  },
  titleBlock: {
    flexShrink: 1,
    gap: 10,
  },
  eyebrow: {
    fontFamily: INTER,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    color: Colors.grey2,
  },
  title: {
    fontFamily: DISPLAY,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -1,
    color: Colors.text,
  },
  titleMuted: {
    color: Colors.textMuted,
  },
  ctaHovered: {
    opacity: 0.85,
  },
  note: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.specSurface,
  },
  noteText: {
    flex: 1,
    minWidth: 220,
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textLightDark,
  },
  count: {
    marginTop: 26,
    fontFamily: INTER,
    fontSize: 10.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
    color: Colors.grey2,
  },
});
