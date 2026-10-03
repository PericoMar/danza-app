import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

interface CompaniesResultsMetaProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function CompaniesResultsMeta({
  isLoggedIn,
  onLogin,
}: CompaniesResultsMetaProps) {
  if (isLoggedIn) return null;

  return (
    <View style={styles.row}>
      <Text style={styles.meta}>
        Browsing as Guest{'  '}
        <Text
          style={[styles.link, styles.linkGuest]}
          onPress={onLogin}
          accessibilityRole="button"
          accessibilityLabel="Log in"
          suppressHighlighting
        >
          Log in
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: 28,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  meta: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  link: {
    textDecorationLine: 'underline',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null),
  },
  linkGuest: {
    color: Colors.text,
  },
});
