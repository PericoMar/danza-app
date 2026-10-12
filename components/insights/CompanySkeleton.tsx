import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/theme/colors';
import { insightsColWidth, insightsHPadding } from '@/theme/insights';

/**
 * Full-screen loading placeholder for the Company Insights page — mirrors the
 * design's shimmering skeleton (title + flag, location, description lines,
 * social row, two content cards).
 */
export default function CompanySkeleton() {
  const { width } = useWindowDimensions();
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
        <View style={styles.row}>
          <Block style={{ height: 34, flex: 1, maxWidth: '60%' }} />
          <Block style={{ height: 22, width: 34, borderRadius: 3 }} />
        </View>

        <View style={styles.row}>
          <Block style={{ height: 18, width: 18, borderRadius: 9 }} />
          <Block style={{ height: 14, width: '40%' }} />
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
    backgroundColor: Colors.white,
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
