import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Animated, Easing, View, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isCompanyFavorite } from "@/services/favorites";
import { FavoritesBus } from "@/services/favorite-bus";
import { useToggleCompanyFavorite } from "@/hooks/useToggleCompanyFavorite";
import { useToast } from "@/providers/ToastProvider";
import { TOAST_LONG_DURATION_MS, ToastTone } from "@/constants/toast";
import { FAVORITE_ADDED_TOAST, FAVORITE_REMOVED_TOAST } from "./favoriteToastPalettes";


type Props = {
  companyId: string;
  /** Si ya lo sabes del listado, pásalo para evitar 1 fetch inicial */
  initialIsFavorite?: boolean;
  size?: number; // icon size
  onChange?: (isFav: boolean) => void; // callback local opcional
  /** Heart colour while favorited (default: the Instagram-like red). */
  activeColor?: string;
  /** Heart colour while not favorited (default: same red, outline style). */
  inactiveColor?: string;
  /** Overrides the default hit-area sizing (e.g. to sit inside a fixed circle). */
  containerStyle?: StyleProp<ViewStyle>;
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
  activeColor,
  inactiveColor,
  containerStyle,
}: Props) {
  const [isFav, setIsFav] = useState<boolean>(initialIsFavorite ?? false);
  // Writes the favorite and patches the cached companies, so the listing's
  // favorites counter and ordering follow the heart.
  const toggle = useToggleCompanyFavorite(companyId);
  // A ref, not `toggle.isPending`: a toast's "Undo" holds an old render's closure.
  const isTogglingRef = useRef(false);
  const { showToast } = useToast();

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

  // Keep sibling instances for the same company in sync (e.g. a header heart and
  // an in-page heart) without re-fetching.
  useEffect(() => {
    const off = FavoritesBus.on((payload) => {
      if (payload.companyId === companyId) setIsFav(payload.isFavorite);
    });
    return () => {
      off();
    };
  }, [companyId]);

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

  /** Flips the favorite from `prev`; also what a removal's "Undo" calls. */
  const toggleFrom = async (prev: boolean) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    // Optimistic UI
    const next = !prev;
    setIsFav(next);
    playAnim(next);

    try {
      const confirmed = await toggle.mutateAsync(prev);
      setIsFav(confirmed);
      onChange?.(confirmed);
      showToast(
        confirmed
          ? { message: "Added to favorites", tone: ToastTone.SUCCESS, palette: FAVORITE_ADDED_TOAST }
          : {
              message: "Removed from favorites",
              tone: ToastTone.INFO,
              palette: FAVORITE_REMOVED_TOAST,
              duration: TOAST_LONG_DURATION_MS,
              action: { label: "Undo", onPress: () => toggleFrom(false) },
            }
      );
    } catch (err) {
      // rollback
      setIsFav(prev);
      showToast({ message: "Couldn't update your favorites. Please try again.", tone: ToastTone.ERROR });
      console.error("toggleFavorite error", err);
    } finally {
      isTogglingRef.current = false;
    }
  };

  const iconName = isFav ? "heart" : "heart-outline";
  const heartColor = isFav ? (activeColor ?? "#ff5151") : (inactiveColor ?? activeColor ?? "#ff5151");

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
      onPress={() => toggleFrom(isFav)}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Toggle favorite for this company"
      hitSlop={10}
      disabled={toggle.isPending}
      style={[
        { justifyContent: "center", alignItems: "center", width: size * 2, height: size * 1.5 },
        containerStyle,
      ]}
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
