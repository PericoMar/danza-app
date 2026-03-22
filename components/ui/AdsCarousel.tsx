import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAds, getPublishedAds } from '@/services/ads';
import { useRole } from '@/providers/RoleProvider';
import type { Ad } from '@/types/ads';

const AUTOPLAY_MS = 5000;
const ANIM_DURATION = 380;

function isAdActive(ad: Ad): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const fromOk = !ad.active_from || ad.active_from.slice(0, 10) <= today;
  const untilOk = !ad.active_until || ad.active_until.slice(0, 10) >= today;
  return fromOk && untilOk;
}

export default function AdsCarousel() {
  const { isAdmin } = useRole();
  const [ads, setAds] = useState<Ad[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to avoid stale closures inside the interval
  const activeIndexRef = useRef(0);
  const adsRef = useRef<Ad[]>([]);
  const containerWidthRef = useRef(0);
  const { width: screenWidth } = useWindowDimensions();

  const CARD_HEIGHT = screenWidth < 600 ? 130 : 170;

  useEffect(() => {
    const fetch = isAdmin ? getAds : getPublishedAds;
    fetch()
      .then(data => {
        const active = data.filter(isAdActive);
        adsRef.current = active;
        setAds(active);
      })
      .catch(() => {});
  }, [isAdmin]);

  const animateTo = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
    Animated.timing(translateX, {
      toValue: -index * containerWidthRef.current,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const count = adsRef.current.length;
      if (count <= 1) return;
      const next = (activeIndexRef.current + 1) % count;
      animateTo(next);
    }, AUTOPLAY_MS);
  };

  // Start/restart timer whenever ads or containerWidth are ready
  useEffect(() => {
    if (ads.length > 1 && containerWidth > 0) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ads.length, containerWidth]);

  const goTo = (index: number) => {
    startTimer(); // reset auto-advance on manual nav
    animateTo(index);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidthRef.current) {
      containerWidthRef.current = w;
      setContainerWidth(w);
      // Snap current slide to new width without animation
      translateX.setValue(-activeIndexRef.current * w);
    }
  };

  const handlePress = (ad: Ad) => {
    if (ad.destination_url) Linking.openURL(ad.destination_url);
  };

  if (ads.length === 0) return null;

  const showArrows = Platform.OS === 'web' && ads.length > 1;
  const showDots = ads.length > 1;

  return (
    <View
      style={[styles.wrapper, { height: CARD_HEIGHT }]}
      onLayout={handleLayout}
    >
      {containerWidth > 0 && (
        <>
          {/* Sliding strip */}
          <Animated.View
            style={[
              styles.strip,
              {
                width: containerWidth * ads.length,
                height: CARD_HEIGHT,
                transform: [{ translateX }],
              },
            ]}
          >
            {ads.map(ad => (
              <Pressable
                key={ad.id}
                style={[styles.slide, { width: containerWidth, height: CARD_HEIGHT }]}
                onPress={() => handlePress(ad)}
                accessibilityRole={ad.destination_url ? 'link' : 'none'}
                accessibilityLabel={ad.title ?? undefined}
              >
                <Image
                  source={{ uri: ad.image_url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                <View style={styles.overlay}>
                  {ad.title ? <Text style={styles.title} numberOfLines={1}>{ad.title}</Text> : null}
                  {ad.description ? (
                    <Text style={styles.description} numberOfLines={1}>{ad.description}</Text>
                  ) : null}
                </View>
                {isAdmin && !ad.published && (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>DRAFT</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* Dots */}
          {showDots && (
            <View style={styles.dotsRow} pointerEvents="none">
              {ads.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Web arrows */}
          {showArrows && (
            <>
              <Pressable
                style={[styles.arrow, styles.arrowLeft]}
                onPress={() => goTo((activeIndex - 1 + ads.length) % ads.length)}
                accessibilityRole="button"
                accessibilityLabel="Previous ad"
              >
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.arrow, styles.arrowRight]}
                onPress={() => goTo((activeIndex + 1) % ads.length)}
                accessibilityRole="button"
                accessibilityLabel="Next ad"
              >
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </Pressable>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  strip: {
    flexDirection: 'row',
  },
  slide: {
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 2,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
    borderRadius: 3,
  },
  arrow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  arrowLeft: {
    left: 0,
  },
  arrowRight: {
    right: 0,
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
