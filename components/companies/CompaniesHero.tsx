import React from 'react';
import { Platform, View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER, DISPLAY, pageMaxWidth, pageHPadding } from '@/theme/companies';
import { COMPANIES_NAV_HIDDEN_MAX_WIDTH } from '@/constants/layout';
import AnimatedStatValue from './AnimatedStatValue';
import GradientText from '@/components/common/GradientText';

export interface CompaniesHeroStats {
  companies: number;
  countries: number;
  closingSoon: number;
}

interface CompaniesHeroProps {
  width: number;
  stats: CompaniesHeroStats;
}

const HERO_ART = require('@/assets/images/ballet-lago-cisnes-1.jpeg');
const ART_AS_BACKGROUND_MAX_WIDTH = 560;

export default function CompaniesHero({ width, stats }: CompaniesHeroProps) {
  const narrow = width <= COMPANIES_NAV_HIDDEN_MAX_WIDTH;
  const asBackground = width <= ART_AS_BACKGROUND_MAX_WIDTH;
  const pH = pageHPadding(width);

  const orbSize = asBackground
    ? Math.min(width * 0.62, 320)
    : Math.max(150, Math.min(435, width * 0.3));

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

  // Both circles are cut-outs onto a single, shared image: the picture is
  // rendered at the same size and origin inside each shape so the two views
  // line up as one continuous photo framed by the orbs.
  const smallSize = orbSize * 0.58;
  const smallLeft = -orbSize * 0.1;
  const smallTop = orbSize * 0.46;
  const sharedImageW = orbSize - smallLeft; // covers both circles horizontally
  const sharedImageH = smallTop + smallSize; // ...and vertically

  const art = (
    <View style={{ width: orbSize, height: orbSize }}>
      <View style={[styles.orbLarge, { borderRadius: orbSize / 2 }]}>
        <Image
          source={HERO_ART}
          style={{
            position: 'absolute',
            left: smallLeft,
            top: 0,
            width: sharedImageW,
            height: sharedImageH,
          }}
          resizeMode="cover"
        />
      </View>
      <View
        style={[
          styles.orbSmall,
          {
            width: smallSize,
            height: smallSize,
            left: smallLeft,
            top: smallTop,
            borderRadius: orbSize * 0.29,
          },
        ]}
      >
        <Image
          source={HERO_ART}
          style={{
            position: 'absolute',
            left: 0,
            top: -smallTop,
            width: sharedImageW,
            height: sharedImageH,
          }}
          resizeMode="cover"
        />
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.head,
        { paddingHorizontal: pH },
        narrow && styles.headCompact,
      ]}
    >
      {asBackground && (
        <View style={styles.artBackground} pointerEvents="none">
          {art}
        </View>
      )}

      <View style={[styles.inner, { maxWidth: pageMaxWidth(width) }, { gap: narrow ? 20 : 44 }]}>
        <View style={styles.copyCol}>
          <Text style={styles.note}>Free · no fees</Text>

          <View accessibilityRole="header" style={styles.titleWrap}>
            <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}>
              Your next contract
            </Text>
            <GradientText style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}>
              is already casting.
            </GradientText>
          </View>

          <Text style={styles.sub}>Every open audition and deadline, in one place.</Text>

          <View style={[styles.stats, asBackground && styles.statsCompact]}>
            {statItems.map((s) => (
              <View key={s.label} style={[styles.stat, asBackground && styles.statCompact]}>
                <AnimatedStatValue
                  value={s.value}
                  style={[styles.statValue, asBackground && styles.statValueCompact]}
                />
                <Text
                  style={[styles.statLabel, asBackground && styles.statLabelCompact]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {!asBackground && <View style={styles.artInline}>{art}</View>}
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
  titleWrap: {
    marginBottom: 16,
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
    flexShrink: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  artBackground: {
    position: 'absolute',
    right: -70,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    opacity: 0.12,
    zIndex: 0,
  },
  orbLarge: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutralLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbSmall: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
