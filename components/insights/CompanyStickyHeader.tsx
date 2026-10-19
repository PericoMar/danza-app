import React, { useMemo, useState } from 'react';
import { View, Animated, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagCdn } from '@/components/ui/FlagCdn';
import { Colors } from '@/theme/colors';
import { DISPLAY, DISPLAY_EXTRABOLD_GLYPHS, insightsColWidth, insightsHPadding } from '@/theme/insights';
import { fitFontSize } from '@/utils/fitText';
import {
  MOBILE_BREAKPOINT,
  INSIGHTS_HEADER_MAX_HEIGHT,
  INSIGHTS_HEADER_MIN_HEIGHT,
  INSIGHTS_HEADER_MAX_FONT,
  INSIGHTS_HEADER_MIN_FONT,
  INSIGHTS_HEADER_SCROLL_RANGE,
  INSIGHTS_HEADER_MAX_LINES,
  INSIGHTS_HEADER_FIT_MIN_FONT,
  INSIGHTS_HEADER_LINE_HEIGHT,
} from '@/constants/layout';

const BACK_LABEL_MIN_WIDTH = 820; // hide "All companies" text below this
const FLAG_SIZE = 22;
const TITLE_GAP = 12; // between the name and the flag
const NAME_LETTER_SPACING = -0.9;

interface CompanyStickyHeaderProps {
  /** Non-native Animated.Value tracking the scroll offset of the page. */
  scrollY: Animated.Value;
  name: string;
  countryIsoCode?: string | null;
  onBack: () => void;
}

/**
 * Pinned company header that collapses as the page scrolls (design's ".chead").
 * Shows a back link and the company name + flag: centered on wide screens,
 * left-aligned on phones so the name gets the whole row. Long names wrap to two
 * lines and shrink to fit rather than truncate.
 */
export default function CompanyStickyHeader({
  scrollY,
  name,
  countryIsoCode,
  onBack,
}: CompanyStickyHeaderProps) {
  const { width } = useWindowDimensions();
  const showBackLabel = width >= BACK_LABEL_MIN_WIDTH;
  const isCompact = width < MOBILE_BREAKPOINT;

  // Width of the title slot, measured so the fit follows the real layout.
  const [titleWidth, setTitleWidth] = useState<number | null>(null);
  const nameMaxWidth = titleWidth == null ? null : titleWidth - (countryIsoCode ? FLAG_SIZE + TITLE_GAP : 0);

  const fittedFont = useMemo(
    () =>
      nameMaxWidth == null
        ? INSIGHTS_HEADER_MAX_FONT
        : fitFontSize(name, {
            maxWidth: nameMaxWidth,
            maxLines: INSIGHTS_HEADER_MAX_LINES,
            maxFont: INSIGHTS_HEADER_MAX_FONT,
            minFont: INSIGHTS_HEADER_FIT_MIN_FONT,
            glyphs: DISPLAY_EXTRABOLD_GLYPHS,
            letterSpacing: NAME_LETTER_SPACING,
          }),
    [name, nameMaxWidth],
  );
  const collapsedFont = Math.min(INSIGHTS_HEADER_MIN_FONT, fittedFont);

  const height = scrollY.interpolate({
    inputRange: [0, INSIGHTS_HEADER_SCROLL_RANGE],
    outputRange: [INSIGHTS_HEADER_MAX_HEIGHT, INSIGHTS_HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  const fontSize = scrollY.interpolate({
    inputRange: [0, INSIGHTS_HEADER_SCROLL_RANGE],
    outputRange: [fittedFont, collapsedFont],
    extrapolate: 'clamp',
  });
  const lineHeight = scrollY.interpolate({
    inputRange: [0, INSIGHTS_HEADER_SCROLL_RANGE],
    outputRange: [fittedFont * INSIGHTS_HEADER_LINE_HEIGHT, collapsedFont * INSIGHTS_HEADER_LINE_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.bar}>
      <Animated.View
        style={[
          styles.inner,
          isCompact && styles.innerCompact,
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

        <View
          style={[styles.title, isCompact && styles.titleCompact]}
          onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
        >
          <Animated.Text
            style={[
              styles.name,
              !isCompact && styles.nameCentered,
              { fontSize, lineHeight },
              titleWidth == null && styles.unmeasured,
            ]}
            numberOfLines={INSIGHTS_HEADER_MAX_LINES}
          >
            {name}
          </Animated.Text>
          {!!countryIsoCode && <FlagCdn iso={countryIsoCode} size={FLAG_SIZE} style={styles.flag} />}
        </View>

        {/* Balances the back link so the title stays centered. */}
        {!isCompact && <View style={styles.actions} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.bg,
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
  innerCompact: {
    gap: TITLE_GAP,
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
    gap: TITLE_GAP,
  },
  titleCompact: {
    justifyContent: 'flex-start',
  },
  name: {
    fontFamily: DISPLAY,
    fontWeight: '800',
    letterSpacing: NAME_LETTER_SPACING,
    color: Colors.text,
    flexShrink: 1,
  },
  nameCentered: {
    textAlign: 'center',
  },
  // Hidden for the first frame, until the title slot is measured and the name
  // can be fitted, so it never flashes truncated.
  unmeasured: {
    opacity: 0,
  },
  flag: {
    flexShrink: 0,
  },
  actions: {
    flexShrink: 0,
    minWidth: 40,
  },
});
