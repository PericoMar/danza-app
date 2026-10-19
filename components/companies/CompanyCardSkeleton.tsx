import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from 'react-native-reanimated';
import { Colors } from '@/theme/colors';

// One pass of the highlight across the card, then the next one right behind.
const SWEEP_MS = 1300;
/** Width of the highlight band, relative to the card. */
const SWEEP_WIDTH_RATIO = 0.6;
const SWEEP_COLORS = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)'] as const;
// Straight across: tilted, the web gradient doesn't fade out along the band's
// sides and leaves a hard vertical edge.
const SWEEP_START = { x: 0, y: 0.5 };
const SWEEP_END = { x: 1, y: 0.5 };

// Sizes mirror CompanyCard, so the real cards land where the placeholders were.
const LOGO_PANEL_HEIGHT = 160;
const LOGO_MARK_SIZE = 84;
const STRIP_MIN_HEIGHT = 54;
const STRIP_ICON_SIZE = 30;
const DESCRIPTION_LINES: DimensionValue[] = ['100%', '94%', '58%'];

type CompanyCardSkeletonProps = {
  /** The card's width, which the highlight travels across. */
  width: number;
};

/**
 * A CompanyCard-shaped placeholder for while the list loads: logo panel, name,
 * country, description and audition strip, with a highlight sweeping across.
 * With reduced motion it stays still.
 */
export default function CompanyCardSkeleton({ width }: CompanyCardSkeletonProps) {
  const reducedMotion = useReducedMotion();
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, sweep]);

  const bandWidth = width * SWEEP_WIDTH_RATIO;

  return (
    <View
      style={styles.card}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.logoPanel}>
        <View style={[styles.bone, styles.logoMark]} />
      </View>

      <View style={styles.body}>
        <View style={[styles.bone, styles.name]} />
        <View style={styles.meta}>
          <View style={[styles.bone, styles.flag]} />
          <View style={[styles.bone, styles.country]} />
        </View>
        <View style={styles.description}>
          {DESCRIPTION_LINES.map((lineWidth, i) => (
            <View key={i} style={[styles.bone, styles.line, { width: lineWidth }]} />
          ))}
        </View>
      </View>

      <View style={styles.strip}>
        <View style={[styles.bone, styles.stripIcon]} />
        <View style={[styles.bone, styles.stripText]} />
      </View>

      {!reducedMotion && (
        <Animated.View
          style={[
            styles.sweep,
            {
              width: bandWidth,
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-bandWidth, width],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={SWEEP_COLORS}
            start={SWEEP_START}
            end={SWEEP_END}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bone: {
    backgroundColor: Colors.skeletonFill,
    borderRadius: 6,
  },
  logoPanel: {
    height: LOGO_PANEL_HEIGHT,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: LOGO_MARK_SIZE,
    height: LOGO_MARK_SIZE,
    borderRadius: LOGO_MARK_SIZE / 2,
  },
  body: {
    padding: 22,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 12,
    flex: 1,
  },
  name: {
    height: 20,
    width: '68%',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    width: 18,
    height: 13,
    borderRadius: 2,
  },
  country: {
    height: 11,
    width: '32%',
  },
  description: {
    gap: 9,
    marginTop: 4,
  },
  line: {
    height: 10,
  },
  strip: {
    minHeight: STRIP_MIN_HEIGHT,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  stripIcon: {
    width: STRIP_ICON_SIZE,
    height: STRIP_ICON_SIZE,
    borderRadius: STRIP_ICON_SIZE / 2,
  },
  stripText: {
    height: 10,
    width: '46%',
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
});
