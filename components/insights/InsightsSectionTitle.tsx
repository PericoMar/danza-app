import React from 'react';
import { Text, StyleSheet, useWindowDimensions, type StyleProp, type TextStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { DISPLAY } from '@/theme/insights';
import { HeadingLevel } from '@/constants/headings';

const TITLE_MIN = 26;
const TITLE_MAX = 40;
/** Share of the window width the title scales with, between the bounds above. */
const TITLE_WIDTH_RATIO = 0.04;

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

/** Big uppercase title of a company page section; an <h2> on web, under the company name. */
export default function InsightsSectionTitle({ children, style }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.max(TITLE_MIN, Math.min(TITLE_MAX, width * TITLE_WIDTH_RATIO));

  return (
    <Text
      accessibilityRole="header"
      aria-level={HeadingLevel.SECTION}
      style={[styles.title, { fontSize: size, lineHeight: size }, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: DISPLAY,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
    color: Colors.text,
  },
});
