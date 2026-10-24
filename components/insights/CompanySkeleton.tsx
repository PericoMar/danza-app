import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/theme/colors';
import { insightsColWidth, insightsHPadding } from '@/theme/insights';
import { MOBILE_BREAKPOINT, INSIGHTS_LOGO_SIZE, INSIGHTS_LOGO_SIZE_COMPACT } from '@/constants/layout';

/**
 * Full-screen loading placeholder for the Company Insights page — mirrors the
 * design's shimmering skeleton (back link on phones, logo + title + location, description lines,
 * social row, two content cards).
 */
export default function CompanySkeleton() {
  const { width } = useWindowDimensions();
  const isCompact = width < MOBILE_BREAKPOINT;
  const logoSize = isCompact ? INSIGHTS_LOGO_SIZE_COMPACT : INSIGHTS_LOGO_SIZE;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const Block = ({ style }: { style: any }) => (
    <Animated.View style={[styles.block, style, { opacity }]} />
  );

  return (
    <View style={styles.overlay} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View
        style={[
          styles.col,
          { maxWidth: insightsColWidth(width), paddingHorizontal: insightsHPadding(width) },
        ]}
      >
        {isCompact && <Block style={{ height: 13, width: 96 }} />}

        <View style={styles.row}>
          <Block style={{ height: logoSize, width: logoSize, borderRadius: 14 }} />
          <View style={styles.headingText}>
            <Block style={{ height: 30, width: '70%' }} />
            <Block style={{ height: 14, width: '45%' }} />
          </View>
        </View>

        <View style={styles.stackTight}>
          <Block style={{ height: 12, width: '100%' }} />
          <Block style={{ height: 12, width: '80%' }} />
          <Block style={{ height: 12, width: '60%' }} />
        </View>

        <View style={styles.row}>
          <Block style={styles.circle} />
          <Block style={styles.circle} />
          <Block style={styles.circle} />
        </View>

        <Block style={styles.card} />
        <Block style={styles.card} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    paddingTop: 110,
    zIndex: 900,
  },
  col: {
    width: '100%',
    alignSelf: 'center',
    gap: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headingText: {
    flex: 1,
    gap: 10,
  },
  stackTight: {
    gap: 10,
  },
  block: {
    backgroundColor: Colors.skeletonFill,
    borderRadius: 6,
  },
  circle: {
    height: 38,
    width: 38,
    borderRadius: 19,
  },
  card: {
    height: 120,
    borderRadius: 12,
  },
});
