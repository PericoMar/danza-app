import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import type { AuditionGenderRestriction } from '@/types/audition';

interface AuditionGenderBadgeProps {
  gender: AuditionGenderRestriction;
  style?: StyleProp<ViewStyle>;
}

const BADGE_COPY = {
  male: { label: 'Men only', a11y: 'Audition open to men only' },
  female: { label: 'Women only', a11y: 'Audition open to women only' },
} as const satisfies Record<AuditionGenderRestriction, { label: string; a11y: string }>;

/**
 * Small frosted pill flagging an audition restricted to a single gender.
 * Positioning is left to the caller via `style`.
 */
export default function AuditionGenderBadge({ gender, style }: AuditionGenderBadgeProps) {
  const copy = BADGE_COPY[gender];
  return (
    <View style={[styles.badge, style]} accessible accessibilityLabel={copy.a11y}>
      <Ionicons name={gender} size={12} color={Colors.grey1} />
      <Text style={styles.label} numberOfLines={1}>
        {copy.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  label: {
    fontFamily: INTER,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.grey1,
  },
});
