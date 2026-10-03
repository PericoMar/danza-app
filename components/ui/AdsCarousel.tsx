import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  PanResponder,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAds, getPublishedAds, logAdEvent, withAdUtm } from '@/services/ads';
import { useRole } from '@/providers/RoleProvider';
import {
  LARGE_SCREEN_BREAKPOINT,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
} from '@/constants/layout';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import type { Ad } from '@/types/ads';

const AUTOPLAY_MS = 6000;
const ANIM_DURATION = 420;
const SWIPE_THRESHOLD = 44;
const DEFAULT_CTA = 'Ver más';

/** Web-only: honour the OS "reduce motion" accessibility setting. */
function prefersReducedMotion(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isAdActive(ad: Ad): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const fromOk = !ad.active_from || ad.active_from.slice(0, 10) <= today;
  const untilOk = !ad.active_until || ad.active_until.slice(0, 10) >= today;
  return fromOk && untilOk;
}

function ctaLabel(ad: Ad): string {
  // Optional per-ad override (DB column `cta_label`) if it ever exists.
  const custom = (ad as { cta_label?: string | null }).cta_label;
  return (custom && custom.trim()) || DEFAULT_CTA;
}

interface AdsCarouselProps {
  onHasAds?: (has: boolean) => void;
  /** Edge-to-edge banner: drops the rounded corners, border and shadow. */
  fullBleed?: boolean;
}

export default function AdsCarousel({ onHasAds, fullBleed = false }: AdsCarouselProps) {
  const { isAdmin } = useRole();
  const [ads, setAds] = useState<Ad[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hovered, setHovered] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs to dodge stale closures inside the interval / pan handlers.
  const activeIndexRef = useRef(0);
  const adsRef = useRef<Ad[]>([]);
  const containerWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const reducedMotionRef = useRef(false);

  const { width: screenWidth } = useWindowDimensions();

  const cardHeight =
    screenWidth < MOBILE_BREAKPOINT
      ? 170
      : screenWidth < TABLET_BREAKPOINT
        ? 200
        : screenWidth < LARGE_SCREEN_BREAKPOINT
          ? 230
          : 260;
  const compact = screenWidth < MOBILE_BREAKPOINT;

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    const fetch = isAdmin ? getAds : getPublishedAds;
    fetch()
      .then((data) => {
        const active = data.filter(isAdActive);
        adsRef.current = active;
        setAds(active);
        onHasAds?.(active.length > 0);
      })
      .catch(() => {
        onHasAds?.(false);
      });
  }, [isAdmin]);

  const trackImpression = (index: number) => {
    const ad = adsRef.current[index];
    if (ad && !seenRef.current.has(ad.id)) {
      seenRef.current.add(ad.id);
      logAdEvent('impression', ad);
    }
  };

  const animateTo = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
    trackImpression(index);
    const to = -index * containerWidthRef.current;
    if (reducedMotionRef.current) {
      translateX.setValue(to);
      return;
    }
    Animated.timing(translateX, {
      toValue: to,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (reducedMotionRef.current) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const count = adsRef.current.length;
      if (count <= 1) return;
      animateTo((activeIndexRef.current + 1) % count);
    }, AUTOPLAY_MS);
  };

  // (Re)start autoplay once ads + width are ready.
  useEffect(() => {
    if (ads.length > 1 && containerWidth > 0) startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length, containerWidth]);

  const goTo = (index: number) => {
    startTimer(); // reset the auto-advance clock on manual nav
    animateTo(index);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidthRef.current) {
      const isFirstLayout = containerWidthRef.current === 0;
      containerWidthRef.current = w;
      setContainerWidth(w);
      translateX.setValue(-activeIndexRef.current * w);
      if (isFirstLayout) {
        trackImpression(0);
        Animated.timing(enterAnim, {
          toValue: 1,
          duration: reducedMotionRef.current ? 0 : 450,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const openAd = (ad: Ad) => {
    logAdEvent('click', ad);
    if (!ad.destination_url) return;
    const url = withAdUtm(ad.destination_url, ad);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => {
          pausedRef.current = true;
        },
        onPanResponderMove: (_, g) => {
          translateX.setValue(
            -activeIndexRef.current * containerWidthRef.current + g.dx,
          );
        },
        onPanResponderRelease: (_, g) => {
          pausedRef.current = false;
          const count = adsRef.current.length;
          let next = activeIndexRef.current;
          if (g.dx <= -SWIPE_THRESHOLD) next = Math.min(next + 1, count - 1);
          else if (g.dx >= SWIPE_THRESHOLD) next = Math.max(next - 1, 0);
          animateTo(next);
          startTimer();
        },
        onPanResponderTerminate: () => {
          pausedRef.current = false;
          animateTo(activeIndexRef.current);
        },
      }),
    [],
  );

  if (ads.length === 0) return null;

  const multi = ads.length > 1;
  const showArrows = Platform.OS === 'web' && multi;
  const panHandlers = multi ? panResponder.panHandlers : {};

  const hoverProps: any =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => {
            setHovered(true);
            pausedRef.current = true;
          },
          onMouseLeave: () => {
            setHovered(false);
            pausedRef.current = false;
          },
        }
      : {};

  return (
    <View
      {...hoverProps}
      style={[
        styles.wrapper,
        fullBleed && styles.wrapperFullBleed,
        { height: cardHeight },
        hovered && !fullBleed && styles.wrapperHover,
      ]}
      onLayout={handleLayout}
      accessibilityLabel="Contenido patrocinado"
    >
      {containerWidth > 0 && (
        <Animated.View style={{ flex: 1, opacity: enterAnim }} {...panHandlers}>
          {/* Sliding strip */}
          <Animated.View
            style={[
              styles.strip,
              {
                width: containerWidth * ads.length,
                height: cardHeight,
                transform: [{ translateX }],
              },
            ]}
          >
            {ads.map((ad) => {
              const clickable = !!ad.destination_url;
              return (
                <Pressable
                  key={ad.id}
                  style={[
                    styles.slide,
                    { width: containerWidth, height: cardHeight },
                    Platform.OS === 'web' && clickable && ({ cursor: 'pointer' } as any),
                  ]}
                  onPress={() => openAd(ad)}
                  disabled={!clickable}
                  accessibilityRole={clickable ? 'link' : 'image'}
                  accessibilityLabel={
                    ad.title
                      ? `Anuncio: ${ad.title}`
                      : 'Anuncio patrocinado'
                  }
                >
                  <Image
                    source={{
                      uri:
                        screenWidth >= LARGE_SCREEN_BREAKPOINT && ad.image_url_desktop
                          ? ad.image_url_desktop
                          : ad.image_url,
                    }}
                    style={{ width: containerWidth, height: cardHeight }}
                    resizeMode="cover"
                  />

                  {/* Legibility scrim — only where the text sits */}
                  {(ad.title || ad.description || clickable) && (
                    <LinearGradient
                      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.34)', 'rgba(0,0,0,0.74)']}
                      locations={[0, 0.55, 1]}
                      style={styles.scrim}
                      pointerEvents="none"
                    />
                  )}

                  {/* Disclosure — trust + ad-standards compliance */}
                  <View style={styles.sponsorChip} pointerEvents="none">
                    <Text style={styles.sponsorChipText}>PATROCINADO</Text>
                  </View>

                  {isAdmin && !ad.published && (
                    <View style={styles.draftBadge} pointerEvents="none">
                      <Text style={styles.draftBadgeText}>DRAFT</Text>
                    </View>
                  )}

                  {/* Copy + CTA */}
                  {(ad.title || ad.description || clickable) && (
                    <View
                      style={[styles.overlay, compact && styles.overlayCompact]}
                      pointerEvents="none"
                    >
                      {ad.title ? (
                        <Text
                          style={[styles.title, compact && styles.titleCompact]}
                          numberOfLines={compact ? 1 : 2}
                        >
                          {ad.title}
                        </Text>
                      ) : null}
                      {ad.description && !compact ? (
                        <Text style={styles.description} numberOfLines={2}>
                          {ad.description}
                        </Text>
                      ) : null}
                      {clickable ? (
                        <View style={styles.ctaRow}>
                          <View style={styles.ctaPill}>
                            <Text style={styles.ctaText}>{ctaLabel(ad)}</Text>
                            <Ionicons name="arrow-forward" size={13} color={Colors.text} />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Dots — now tappable */}
          {multi && (
            <View style={styles.dotsRow}>
              {ads.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => goTo(i)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Ir al anuncio ${i + 1} de ${ads.length}`}
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Web arrows — surface on hover only */}
          {showArrows && hovered && (
            <>
              <Pressable
                style={[styles.arrow, styles.arrowLeft]}
                onPress={() => goTo((activeIndex - 1 + ads.length) % ads.length)}
                accessibilityRole="button"
                accessibilityLabel="Anuncio anterior"
              >
                <Ionicons name="chevron-back" size={18} color={Colors.text} />
              </Pressable>
              <Pressable
                style={[styles.arrow, styles.arrowRight]}
                onPress={() => goTo((activeIndex + 1) % ads.length)}
                accessibilityRole="button"
                accessibilityLabel="Siguiente anuncio"
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.text} />
              </Pressable>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    ...Platform.select({
      web: { boxShadow: '0 10px 30px -18px rgba(0,0,0,0.25)', transition: 'box-shadow 160ms ease' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  wrapperFullBleed: {
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
  wrapperHover: {
    ...Platform.select({
      web: { boxShadow: '0 18px 42px -20px rgba(0,0,0,0.32)' },
      default: {},
    }),
  },
  strip: {
    flexDirection: 'row',
  },
  slide: {
    overflow: 'hidden',
    position: 'relative',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  sponsorChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sponsorChipText: {
    fontFamily: INTER,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.grey2,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
  },
  overlayCompact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  title: {
    fontFamily: INTER,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    maxWidth: '86%',
  },
  titleCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  description: {
    fontFamily: INTER,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: '80%',
  },
  ctaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: INTER,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: Colors.text,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 4px 14px -4px rgba(0,0,0,0.4)' } as any,
      default: {},
    }),
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  draftBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  draftBadgeText: {
    color: '#f5c542',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
