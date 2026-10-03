import React from 'react';
import { View, Animated, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagCdn } from '@/components/ui/FlagCdn';
import { Colors } from '@/theme/colors';
import { DISPLAY, insightsColWidth, insightsHPadding } from '@/theme/insights';
import {
  INSIGHTS_HEADER_MAX_HEIGHT,
  INSIGHTS_HEADER_MIN_HEIGHT,
  INSIGHTS_HEADER_MAX_FONT,
  INSIGHTS_HEADER_MIN_FONT,
  INSIGHTS_HEADER_SCROLL_RANGE,
} from '@/constants/layout';

const BACK_LABEL_MIN_WIDTH = 820; // hide "All companies" text below this

interface CompanyStickyHeaderProps {
  /** Non-native Animated.Value tracking the scroll offset of the page. */
  scrollY: Animated.Value;
  name: string;
  countryIsoCode?: string | null;
  onBack: () => void;
}

/**
 * Pinned company header that collapses as the page scrolls (design's ".chead").
 * Shows a back link and the centered company name + flag.
 */
export default function CompanyStickyHeader({
  scrollY,
  name,
  countryIsoCode,
  onBack,
}: CompanyStickyHeaderProps) {
  const { width } = useWindowDimensions();
  const showBackLabel = width >= BACK_LABEL_MIN_WIDTH;

  const height = scrollY.interpolate({
    inputRange: [0, INSIGHTS_HEADER_SCROLL_RANGE],
    outputRange: [INSIGHTS_HEADER_MAX_HEIGHT, INSIGHTS_HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  const fontSize = scrollY.interpolate({
    inputRange: [0, INSIGHTS_HEADER_SCROLL_RANGE],
    outputRange: [INSIGHTS_HEADER_MAX_FONT, INSIGHTS_HEADER_MIN_FONT],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.bar}>
      <Animated.View
        style={[
          styles.inner,
          {
            height,
            maxWidth: insightsColWidth(width),
            paddingHorizontal: insightsHPadding(width),
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={styles.back}
          accessibilityRole="link"
          accessibilityLabel="Back to all companies"
        >
          <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
          {showBackLabel && <Animated.Text style={styles.backText}>All companies</Animated.Text>}
        </Pressable>

        <View style={styles.title}>
          <Animated.Text style={[styles.name, { fontSize }]} numberOfLines={1}>
            {name}
          </Animated.Text>
          {!!countryIsoCode && <FlagCdn iso={countryIsoCode} size={22} style={styles.flag} />}
        </View>

        <View style={styles.actions} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    zIndex: 40,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null),
  },
  backText: {
    fontFamily: DISPLAY,
    fontSize: 13,
    color: Colors.textMuted,
  },
  title: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  name: {
    fontFamily: DISPLAY,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: Colors.text,
    flexShrink: 1,
  },
  flag: {
    flexShrink: 0,
  },
  actions: {
    flexShrink: 0,
    minWidth: 40,
  },
});
