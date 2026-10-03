import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER } from '@/theme/insights';

const TITLE_MIN = 26;
const TITLE_MAX = 40;

/** Heading for the reviews section (design's ".insights > .ins-head"). */
export default function InsightsSectionHeader() {
  const { width } = useWindowDimensions();
  const titleSize = Math.max(TITLE_MIN, Math.min(TITLE_MAX, width * 0.04));

  return (
    <View style={styles.head}>
      <Text style={styles.eyebrow}>From dancers who were there</Text>
      <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize }]}>
        Insights <Text style={styles.titleMuted}>&amp; reviews</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: 8,
  },
  eyebrow: {
    fontFamily: INTER,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: Colors.grey2,
  },
  title: {
    fontFamily: DISPLAY,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
    color: Colors.text,
  },
  titleMuted: {
    color: Colors.textMuted,
  },
});
