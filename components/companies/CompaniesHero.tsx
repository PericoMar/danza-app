import React, { useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER, DISPLAY, pageMaxWidth, pageHPadding } from '@/theme/companies';
import { COMPANIES_HERO_COMPACT_MAX_WIDTH, COMPANIES_NAV_HIDDEN_MAX_WIDTH } from '@/constants/layout';
import AnimatedStatValue from './AnimatedStatValue';
import ImageRing from './ImageRing';
import GradientText from '@/components/common/GradientText';
import { useHeroRingSources } from '@/hooks/useHeroRingImages';

export interface CompaniesHeroStats {
  companies: number;
  countries: number;
  closingSoon: number;
}

interface CompaniesHeroProps {
  width: number;
  stats: CompaniesHeroStats;
}

// Desktop: the title tops out around 7× its font size, so half the viewport
// still leaves it room on one line next to the ring.
const RING_DESKTOP_WIDTH_RATIO = 0.5;
const RING_DESKTOP_MAX_WIDTH = 692;
const RING_TABLET_WIDTH_RATIO = 0.4;
const RING_TABLET_MIN_WIDTH = 240;
const RING_TABLET_MAX_WIDTH = 520;
// Compact: the ring fills whatever the title leaves on its right.
const RING_COMPACT_MAX_WIDTH = 200;
const RING_COMPACT_MIN_WIDTH = 88; // narrower than this it's too small to read, so it's dropped
const RING_COMPACT_BEZEL = 1.5;    // half the default frame, which looks heavy on such small photos

function inlineRingWidth(width: number): number {
  if (width > COMPANIES_NAV_HIDDEN_MAX_WIDTH) {
    return Math.min(RING_DESKTOP_MAX_WIDTH, width * RING_DESKTOP_WIDTH_RATIO);
  }
  return Math.max(RING_TABLET_MIN_WIDTH, Math.min(RING_TABLET_MAX_WIDTH, width * RING_TABLET_WIDTH_RATIO));
}

export default function CompaniesHero({ width, stats }: CompaniesHeroProps) {
  const narrow = width <= COMPANIES_NAV_HIDDEN_MAX_WIDTH;
  const compact = width <= COMPANIES_HERO_COMPACT_MAX_WIDTH;
  const pH = pageHPadding(width);
  // Compact only: width left beside the title, measured because it depends on
  // the font actually rendered (Inter on web, the system font on native).
  const [ringSlotWidth, setRingSlotWidth] = useState(0);
  const compactRingWidth = Math.min(ringSlotWidth, RING_COMPACT_MAX_WIDTH);
  // Empty until the photos are ready: the ring keeps its space and blooms in then.
  const ringImages = useHeroRingSources() ?? [];

  const titleSize = Math.max(30, Math.min(68, width * 0.05));
  // Web tolerates a line-height tighter than the font size (negative leading);
  // native clips ascenders/descenders when lineHeight < fontSize, so give it
  // normal breathing room there instead.
  const titleLine = Platform.OS === 'web' ? titleSize * 0.92 : titleSize * 1.08;

  const statItems = [
    { value: stats.companies, label: 'Companies' },
    { value: stats.countries, label: 'Countries' },
    { value: stats.closingSoon, label: 'Calls closing soon' },
  ];

  return (
    <View
      style={[
        styles.head,
        { paddingHorizontal: pH },
        narrow && styles.headCompact,
      ]}
    >
      <View
        style={[
          styles.inner,
          { maxWidth: pageMaxWidth(width) },
          { gap: narrow ? 20 : 44 },
        ]}
      >
        <View style={styles.copyCol}>
          <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
            <View>
              <Text style={styles.note}>Free · no fees</Text>

              <View accessibilityRole="header">
                {/* Compact breaks after "Where" so the ring gets room beside the title. */}
                <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}>
                  {compact ? 'Where\ndancers' : 'Where dancers'}
                </Text>
                <GradientText style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}>
                  find work
                </GradientText>
              </View>
            </View>

            {compact && (
              <View
                style={styles.ringSlot}
                onLayout={(e) => setRingSlotWidth(e.nativeEvent.layout.width)}
              >
                {compactRingWidth >= RING_COMPACT_MIN_WIDTH && (
                  <ImageRing images={ringImages} width={compactRingWidth} bezel={RING_COMPACT_BEZEL} />
                )}
              </View>
            )}
          </View>

          <Text style={styles.sub}>Every audition in one place</Text>

          <View style={[styles.stats, compact && styles.statsCompact]}>
            {statItems.map((s) => (
              <View key={s.label} style={[styles.stat, compact && styles.statCompact]}>
                <AnimatedStatValue
                  value={s.value}
                  style={[styles.statValue, compact && styles.statValueCompact]}
                />
                <Text
                  style={[styles.statLabel, compact && styles.statLabelCompact]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {!compact && (
          <View style={styles.artInline}>
            <ImageRing images={ringImages} width={inlineRingWidth(width)} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingTop: 46,
    paddingBottom: 42,
    position: 'relative',
    overflow: 'hidden',
  },
  headCompact: {
    paddingTop: 34,
    paddingBottom: 32,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    marginBottom: 16,
  },
  titleRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ringSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  title: {
    fontFamily: DISPLAY,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1.4,
    color: Colors.text,
  },
  sub: {
    fontFamily: INTER,
    fontSize: 17,
    lineHeight: 25,
    color: Colors.textLightDark,
    maxWidth: 620,
  },
  note: {
    fontFamily: INTER,
    fontSize: 10.5,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    color: Colors.grey2,
    marginBottom: 14,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 26,
    marginTop: 26,
  },
  statsCompact: {
    flexWrap: 'nowrap',
    gap: 14,
    marginTop: 22,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
  },
  statCompact: {
    flexShrink: 1,
    gap: 5,
  },
  statValue: {
    fontFamily: DISPLAY,
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.7,
    color: Colors.text,
  },
  statValueCompact: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: INTER,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  statLabelCompact: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  artInline: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
