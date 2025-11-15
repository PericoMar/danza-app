import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Animated, Easing, View, AccessibilityInfo } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isCompanyFavorite, toggleFavorite } from "@/services/favorites";
import { FavoritesBus } from "@/services/favorite-bus";


type Props = {
  companyId: string;
  /** Si ya lo sabes del listado, pásalo para evitar 1 fetch inicial */
  initialIsFavorite?: boolean;
  size?: number; // icon size
  onChange?: (isFav: boolean) => void; // callback local opcional
};

/**
 * Instagram-like favorite button (black heart) with bounce + burst.
 * Optimistic UI + RLS-secured Supabase writes.
 */
export default function FavoriteHeartButton({
  companyId,
  initialIsFavorite,
  size = 26,
  onChange,
}: Props) {
  const [isFav, setIsFav] = useState<boolean>(initialIsFavorite ?? false);
  const [loading, setLoading] = useState<boolean>(false);

  // Animations
  const scale = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current; // opacity/size for burst ring

  // Fetch initial if not provided
  useEffect(() => {
    let mounted = true;
    if (initialIsFavorite === undefined) {
      isCompanyFavorite(companyId).then((res) => {
        if (mounted) setIsFav(res);
      }).catch(() => {});
    }
    return () => { mounted = false; };
  }, [companyId, initialIsFavorite]);

  // A11y label
  const a11yLabel = useMemo(
    () => (isFav ? "Quitar de favoritos" : "Añadir a favoritos"),
    [isFav]
  );

  function playAnim(favoriting: boolean) {
    // bounce
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(scale, { toValue: 1.15, duration: 140, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // burst ring (solo cuando se añade)
    if (favoriting) {
      burst.setValue(0);
      Animated.timing(burst, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start(() => {
        burst.setValue(0);
      });
    }
  }

  const onPress = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic UI
    const prev = isFav;
    const next = !prev;
    setIsFav(next);
    playAnim(next);

    try {
      const confirmed = await toggleFavorite(companyId, prev);
      setIsFav(confirmed);
      onChange?.(confirmed);
      FavoritesBus.emit({ companyId, isFavorite: confirmed });
      AccessibilityInfo.announceForAccessibility?.(
        confirmed ? "Añadido a favoritos" : "Eliminado de favoritos"
      );
    } catch (err) {
      // rollback
      setIsFav(prev);
      AccessibilityInfo.announceForAccessibility?.("No se pudo actualizar el favorito");
      console.error("toggleFavorite error", err);
    } finally {
      setLoading(false);
    }
  };

  const iconName = isFav ? "heart" : "heart-outline";
  const heartColor = "#ff5151ff"; // negro como pediste

  const burstStyle = {
    position: "absolute" as const,
    width: size * 2.4,
    height: size * 2.4,
    // borderRadius: (size * 2.4) / 2,
    // borderWidth: 2,
    // borderColor: heartColor,
    opacity: burst.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
    transform: [
      {
        scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] }),
      },
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Toggle favorite for this company"
      hitSlop={10}
      disabled={loading}
      style={{ justifyContent: "center", alignItems: "center", width: size * 2, height: size * 1.5 }}
    >
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Animated.View style={burstStyle} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={iconName} size={size} color={heartColor} />
        </Animated.View>
      </View>
    </Pressable>
  );
}
