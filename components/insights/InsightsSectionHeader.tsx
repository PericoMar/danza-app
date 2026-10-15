import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/insights';
import InsightsSectionTitle from '@/components/insights/InsightsSectionTitle';

/** Heading for the reviews section (design's ".insights > .ins-head"). */
export default function InsightsSectionHeader() {
  return (
    <View style={styles.head}>
      <Text style={styles.eyebrow}>From dancers who were there</Text>
      <InsightsSectionTitle>
        Insights <Text style={styles.titleMuted}>&amp; reviews</Text>
      </InsightsSectionTitle>
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
  titleMuted: {
    color: Colors.textMuted,
  },
});
