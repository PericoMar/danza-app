import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/insights';
import { INSIGHTS_COMPACT_BREAKPOINT, DESCRIPTION_CLAMP_MIN_CHARS } from '@/constants/layout';

interface CompanyDescriptionProps {
  text?: string | null;
}

/**
 * Company blurb. On wide screens it shows in full; on compact screens it clamps
 * to two lines with a "view more" toggle (matches the design's ".desc").
 */
export default function CompanyDescription({ text }: CompanyDescriptionProps) {
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isCompact = width <= INSIGHTS_COMPACT_BREAKPOINT;
  const canToggle = isCompact && text.length > DESCRIPTION_CLAMP_MIN_CHARS;

  return (
    <View style={styles.block}>
      <Text
        style={styles.text}
        numberOfLines={isCompact && !expanded ? 2 : undefined}
      >
        {text}
      </Text>

      {canToggle && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
          accessibilityRole="button"
        >
          <Text style={styles.toggle}>{expanded ? 'view less' : 'view more...'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 16,
    maxWidth: 760,
  },
  text: {
    fontFamily: INTER,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textLightDark,
  },
  toggle: {
    fontFamily: INTER,
    marginTop: 8,
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
