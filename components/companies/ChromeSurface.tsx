import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '@/theme/colors';
import { CHROME_GRADIENT_START, CHROME_GRADIENT_END } from '@/theme/companies';

type ChromeVariant = 'chrome' | 'chromeSoft' | 'dark';

interface ChromeSurfaceProps {
  variant?: ChromeVariant;
  /** Adds the brushed-metal ring (light inset + hairline + soft drop shadow). */
  ring?: boolean;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const GRADIENT_BY_VARIANT = {
  chrome: Gradients.chrome,
  chromeSoft: Gradients.chromeSoft,
  dark: Gradients.darkPill,
} as const;

/**
 * Metallic "chrome" surface from the Companies design — a linear-gradient fill
 * with an optional pressed-metal ring. Wrap it in a Pressable for buttons.
 */
export default function ChromeSurface({
  variant = 'chrome',
  ring = true,
  borderRadius = 3,
  style,
  children,
}: ChromeSurfaceProps) {
  const g = GRADIENT_BY_VARIANT[variant];
  const isDark = variant === 'dark';

  return (
    <View
      style={[
        styles.base,
        { borderRadius, borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)' },
        ring && (isDark ? styles.ringDark : styles.ring),
        style,
      ]}
    >
      <LinearGradient
        colors={g.colors}
        locations={g.locations}
        start={CHROME_GRADIENT_START}
        end={CHROME_GRADIENT_END}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  ring: {
    ...Platform.select({
      web: {
        boxShadow:
          '0 1px 0 rgba(255,255,255,.95) inset, 0 -1px 0 rgba(0,0,0,.08) inset, 0 0 0 1px rgba(145,150,160,.45), 0 6px 16px -8px rgba(40,44,55,.32)',
      },
      default: {
        shadowColor: '#282c37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
  },
  ringDark: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 0 rgba(255,255,255,.18) inset, 0 8px 20px -12px rgba(0,0,0,.6)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
});
