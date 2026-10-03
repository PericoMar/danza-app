import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

interface StatTileProps {
  label: string;
  value: string;
  /** Optional delta text, e.g. "+12.4% vs prev. 30 days" — colored by sign. */
  delta?: { text: string; positive: boolean } | null;
}

export default function StatTile({ label, value, delta }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {delta && (
        <Text style={[styles.delta, { color: delta.positive ? Colors.successText : Colors.textMuted }]}>
          {delta.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    padding: 16,
    gap: 6,
  },
  label: {
    fontFamily: INTER,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontFamily: INTER,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  delta: {
    fontFamily: INTER,
    fontSize: 12,
    fontWeight: '600',
  },
});
