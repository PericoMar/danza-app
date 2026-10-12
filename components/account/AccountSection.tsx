import type { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { PROFILE_SECTION_GAP, PROFILE_SECTION_LABEL_WIDTH } from "@/constants/layout";

type AccountSectionProps = {
  /** Small index shown above the title, e.g. "01". */
  index: string;
  title: string;
  description?: string;
  isWide: boolean;
  children: ReactNode;
};

/**
 * One hairline-ruled settings block. Wide: label column on the left, content on
 * the right. Compact: label stacked above the content.
 */
export function AccountSection({ index, title, description, isWide, children }: AccountSectionProps) {
  return (
    <View style={[styles.section, isWide ? styles.sectionWide : styles.sectionCompact]}>
      <View style={isWide ? styles.labelWide : styles.labelCompact}>
        <Text style={styles.index}>{index}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.body, isWide && styles.bodyWide]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  sectionWide: {
    flexDirection: "row",
    gap: PROFILE_SECTION_GAP,
    paddingVertical: 36,
  },
  sectionCompact: {
    paddingVertical: 28,
    gap: 20,
  },
  labelWide: {
    width: PROFILE_SECTION_LABEL_WIDTH,
    flexShrink: 0,
  },
  labelCompact: {},
  index: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  title: {
    fontFamily: INTER,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Colors.text,
  },
  description: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textMuted,
    marginTop: 8,
    maxWidth: 420,
  },
  body: {
    gap: 18,
  },
  bodyWide: {
    flex: 1,
    minWidth: 0,
  },
});
