import React, { ComponentProps } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

interface CardBadgeProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small frosted pill (icon + uppercase label) laid over a card's image panel.
 * Positioning is left to the caller via `style`.
 */
export default function CardBadge({ icon, label, accessibilityLabel, style }: CardBadgeProps) {
  return (
    <View style={[styles.badge, style]} accessible accessibilityLabel={accessibilityLabel}>
      <Ionicons name={icon} size={12} color={Colors.grey1} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
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
