import type { ReactNode } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { accountTitleSize } from "./styles";

type AccountHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  isWide: boolean;
  /** "danger" tints the eyebrow dot for destructive pages. */
  tone?: "default" | "danger";
  /** Rendered beside the copy on wide screens, below it on compact ones. */
  aside?: ReactNode;
};

/** Eyebrow + oversized headline + muted subtitle — the newsletter hero, for account pages. */
export function AccountHero({
  eyebrow,
  title,
  subtitle,
  isWide,
  tone = "default",
  aside,
}: AccountHeroProps) {
  const { width } = useWindowDimensions();
  const titleSize = accountTitleSize(width, isWide);

  return (
    <View style={[styles.hero, isWide && styles.heroWide]}>
      <View style={styles.copy}>
        <View style={styles.eyebrow}>
          <View style={[styles.dot, tone === "danger" && styles.dotDanger]} />
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>

        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.04) },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text style={[styles.subtitle, isWide ? styles.subtitleWide : styles.subtitleCompact]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {aside ? <View style={isWide ? styles.asideWide : styles.asideCompact}>{aside}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
  },
  heroWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 48,
  },
  copy: {
    flexShrink: 1,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  dotDanger: {
    backgroundColor: Colors.dangerText,
  },
  eyebrowText: {
    fontFamily: INTER,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: Colors.text,
  },
  title: {
    fontFamily: INTER,
    fontWeight: "800",
    letterSpacing: -1.5,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: INTER,
    color: Colors.textLightDark,
    maxWidth: 560,
  },
  subtitleWide: {
    fontSize: 17,
    lineHeight: 26,
    marginTop: 20,
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  asideWide: {
    flexShrink: 0,
    paddingBottom: 6,
  },
  asideCompact: {
    marginTop: 28,
  },
});
