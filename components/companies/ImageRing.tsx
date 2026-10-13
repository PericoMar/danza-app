import React, { useEffect, useId } from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  PointerEvent,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Colors } from '@/theme/colors';
import ChromeSurface from './ChromeSurface';

// ─── Geometry ────────────────────────────────────────────────────────────────
const TWO_PI = Math.PI * 2;
const ITEM_RATIO = 0.3;    // front photo diameter / stage width
const TILT = 0.38;         // vertical / horizontal radius: how far we look down onto the ring
const TILT_SWAY = 0.04;    // the ring slowly rocks by ± this much
const POINTER_TILT = 0.08; // extra tilt range driven by the pointer's height (web)
const TILT_MAX = TILT + TILT_SWAY + POINTER_TILT;
const BACK_SCALE = 0.5;    // photo size at the back of the ring, relative to the front
const BACK_VEIL = 0.62;    // white haze over the farthest photo (aerial perspective)
const BEZEL = 3;           // default chrome frame around each photo
const FLOAT_RATIO = 0.018; // each photo bobs by ± this fraction of the stage width

// ─── Motion ──────────────────────────────────────────────────────────────────
const SPIN_PERIOD_MS = 38000;  // one full turn at cruising speed
const HOVER_SPIN_FACTOR = 0.2; // the ring slows to this while hovered
const TILT_PERIOD_MS = 11000;
const FLOAT_PERIOD_MS = 4600;
const INTRO_MS = 1800;
const INTRO_SPIN = Math.PI * 0.9; // the ring winds in from this extra angle on mount
const FOLLOW_MS = 260;            // time constant for speed / tilt to catch up with their targets
const MAX_FRAME_MS = 64;          // clamp long frames (tab switches) so the ring never jumps

const CRUISE_SPEED = TWO_PI / SPIN_PERIOD_MS; // rad per ms

interface ImageRingProps {
  /** Empty keeps the stage's space but draws nothing; the ring blooms in once photos arrive. */
  images: ImageSourcePropType[];
  /** Stage width; the height follows from it. */
  width: number;
  /** Chrome frame around each photo, in px. */
  bezel?: number;
}

/** Where a photo is on the ring; while the intro plays it winds in from further back. */
function photoAngle(rotation: number, offset: number, spread: number): number {
  'worklet';
  return rotation + offset + INTRO_SPIN * (1 - spread);
}

/** Height the ring needs for a given stage width. */
function imageRingHeight(width: number): number {
  const { item, ry, float } = ringGeometry(width);
  const ryMax = ry * (TILT_MAX / TILT);
  return 2 * ryMax + item * ((1 + BACK_SCALE) / 2) + 2 * float;
}

function ringGeometry(width: number) {
  const item = width * ITEM_RATIO;
  const rx = (width - item) / 2;
  return { item, rx, ry: rx * TILT, float: width * FLOAT_RATIO };
}

/**
 * Round photos orbiting on a tilted ring. Depth is faked in 2D so it runs the
 * same on web and native: each photo shrinks, rises and fades into a white
 * haze as it travels to the back, and its z-order follows its depth. On mount
 * the ring blooms out of its centre; afterwards it spins slowly, rocks, and the
 * photos float. Hovering slows it down and the pointer's height tilts it (web).
 * With reduced motion it renders as a still ring.
 */
export default function ImageRing({ images, width, bezel = BEZEL }: ImageRingProps) {
  const reducedMotion = useReducedMotion();
  const { item, rx, ry, float } = ringGeometry(width);
  const height = imageRingHeight(width);
  const cx = width / 2;
  // Back photos sit higher and are smaller than front ones, so the centre is
  // not the middle of the stage.
  const cy = ry * (TILT_MAX / TILT) + (item * BACK_SCALE) / 2 + float;

  const clock = useSharedValue(0);
  const rotation = useSharedValue(0);
  const speed = useSharedValue(CRUISE_SPEED);
  const speedTarget = useSharedValue(CRUISE_SPEED);
  const tilt = useSharedValue(TILT);
  const pointerTilt = useSharedValue(0);
  const intro = useSharedValue(reducedMotion ? 1 : 0);
  const hasImages = images.length > 0;

  useEffect(() => {
    if (!hasImages) return;
    if (reducedMotion) {
      intro.value = 1;
      return;
    }
    intro.value = withTiming(1, { duration: INTRO_MS, easing: Easing.out(Easing.cubic) });
  }, [hasImages, reducedMotion, intro]);

  const frameCallback = useFrameCallback((frame) => {
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16, MAX_FRAME_MS);
    const follow = 1 - Math.exp(-dt / FOLLOW_MS);
    clock.value += dt;
    speed.value += (speedTarget.value - speed.value) * follow;
    rotation.value = (rotation.value + speed.value * dt) % TWO_PI;
    const sway = TILT_SWAY * Math.sin((clock.value / TILT_PERIOD_MS) * TWO_PI);
    tilt.value += (TILT + sway + pointerTilt.value - tilt.value) * follow;
  }, false);

  // `useFrameCallback` only reads its autostart flag on mount, and the photos
  // may arrive later, so the loop is switched on and off here instead.
  const animate = hasImages && !reducedMotion;
  useEffect(() => {
    frameCallback.setActive(animate);
  }, [animate, frameCallback]);

  const onPointerEnter = () => {
    speedTarget.value = CRUISE_SPEED * HOVER_SPIN_FACTOR;
  };
  const onPointerLeave = () => {
    speedTarget.value = CRUISE_SPEED;
    pointerTilt.value = 0;
  };
  const onPointerMove = (e: PointerEvent) => {
    // -1 at the top of the stage, 1 at the bottom: pointing lower looks
    // further down onto the ring.
    const t = (e.nativeEvent.offsetY / height) * 2 - 1;
    pointerTilt.value = Math.max(-1, Math.min(1, t)) * POINTER_TILT;
  };

  const step = TWO_PI / images.length;

  return (
    <View
      style={{ width, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...(Platform.OS === 'web' ? ({ 'aria-hidden': true } as object) : null)}
    >
      {hasImages && <RingTrack cx={cx} cy={cy} rx={rx} ry={ry} item={item} tilt={tilt} intro={intro} />}

      {images.map((source, i) => (
        <RingPhoto
          key={i}
          source={source}
          offset={i * step}
          phase={i * 1.7}
          cx={cx}
          cy={cy}
          rx={rx}
          item={item}
          bezel={bezel}
          float={float}
          clock={clock}
          rotation={rotation}
          tilt={tilt}
          intro={intro}
        />
      ))}

      {/* Transparent top layer that owns the pointer, so offsets are always
          relative to the stage rather than to whichever photo is underneath. */}
      {hasImages && !reducedMotion && (
        <View
          style={[StyleSheet.absoluteFill, styles.pointerLayer]}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerMove={onPointerMove}
        />
      )}
    </View>
  );
}

interface RingMotion {
  clock: SharedValue<number>;
  rotation: SharedValue<number>;
  tilt: SharedValue<number>;
  intro: SharedValue<number>;
}

interface RingPhotoProps extends RingMotion {
  source: ImageSourcePropType;
  /** Where on the ring this photo sits, in radians. */
  offset: number;
  /** Desynchronises the float so photos don't bob in unison. */
  phase: number;
  cx: number;
  cy: number;
  rx: number;
  item: number;
  bezel: number;
  float: number;
}

function RingPhoto({
  source,
  offset,
  phase,
  cx,
  cy,
  rx,
  item,
  bezel,
  float,
  clock,
  rotation,
  tilt,
  intro,
}: RingPhotoProps) {
  const placement = useAnimatedStyle(() => {
    const spread = intro.value;
    const theta = photoAngle(rotation.value, offset, spread);
    const depth = Math.cos(theta); // 1 = front, -1 = back
    const near = (depth + 1) / 2;
    const bob = float * Math.sin((clock.value / FLOAT_PERIOD_MS) * TWO_PI + phase);
    return {
      opacity: spread,
      zIndex: Math.round(near * 1000) + 1,
      transform: [
        { translateX: Math.sin(theta) * rx * spread },
        { translateY: depth * rx * tilt.value * spread + bob },
        { scale: (BACK_SCALE + (1 - BACK_SCALE) * near) * (0.6 + 0.4 * spread) },
      ],
    };
  });

  const haze = useAnimatedStyle(() => {
    const theta = photoAngle(rotation.value, offset, intro.value);
    return { opacity: ((1 - Math.cos(theta)) / 2) * BACK_VEIL };
  });

  const inner = item - bezel * 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.photo,
        { width: item, height: item, left: cx - item / 2, top: cy - item / 2, borderRadius: item / 2 },
        placement,
      ]}
    >
      <ChromeSurface ring={false} borderRadius={item / 2} style={[styles.bezel, { padding: bezel - 1 }]}>
        <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden' }}>
          {/* Explicit size: on web an Image without one takes the asset's intrinsic size. */}
          <Image source={source} style={{ width: inner, height: inner }} resizeMode="cover" />
          <Animated.View style={[StyleSheet.absoluteFill, styles.haze, haze]} />
        </View>
      </ChromeSurface>
    </Animated.View>
  );
}

interface RingTrackProps {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  item: number;
  tilt: SharedValue<number>;
  intro: SharedValue<number>;
}

/**
 * The orbit hairline plus a soft floor shadow, drawn once at the resting tilt
 * and stretched vertically to follow the ring as it rocks. The line fades
 * towards the back so the front arc reads as nearer.
 */
function RingTrack({ cx, cy, rx, ry, item, tilt, intro }: RingTrackProps) {
  const ids = useId().replace(/:/g, '');
  const lineId = `ring-line-${ids}`;
  const floorId = `ring-floor-${ids}`;

  // Room for the floor shadow under the front photo.
  const floorY = ry + item * 0.5;
  const floorRx = rx * 0.95;
  const floorRy = ry * 0.42;
  const boxW = rx * 2 + 2;
  const boxH = (floorY + floorRy) * 2 + 2;

  const follow = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ scaleX: intro.value }, { scaleY: (tilt.value / TILT) * intro.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.track, { width: boxW, height: boxH, left: cx - boxW / 2, top: cy - boxH / 2 }, follow]}
    >
      <Svg width={boxW} height={boxH}>
        <LinearGradient id={lineId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Colors.text} stopOpacity={0.04} />
          <Stop offset="1" stopColor={Colors.text} stopOpacity={0.26} />
        </LinearGradient>
        <RadialGradient id={floorId} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={Colors.text} stopOpacity={0.12} />
          <Stop offset="1" stopColor={Colors.text} stopOpacity={0} />
        </RadialGradient>
        <Ellipse cx={boxW / 2} cy={boxH / 2 + floorY} rx={floorRx} ry={floorRy} fill={`url(#${floorId})`} />
        <Ellipse
          cx={boxW / 2}
          cy={boxH / 2}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth={1}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  photo: {
    position: 'absolute',
    ...Platform.select({
      web: { boxShadow: '0 22px 34px -18px rgba(20,22,28,.45)' } as object,
      default: {
        shadowColor: '#14161c',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  bezel: {
    flex: 1,
  },
  haze: {
    backgroundColor: Colors.white,
  },
  track: {
    position: 'absolute',
    zIndex: 0,
  },
  pointerLayer: {
    zIndex: 2000,
  },
});
