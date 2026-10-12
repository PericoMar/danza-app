import React, { useRef } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleProp, Text, ViewStyle } from "react-native";
import { Colors } from "@/theme/colors";
import { authStyles } from "./authStyles";
import { useAuthScale } from "./useAuthScale";

interface AuthButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared auth-form primary button — flat black CTA with a small press-scale
 * for tactile feedback, matching the rest of the app's button conventions.
 */
export default function AuthButton({ onPress, label, loading, disabled, style }: AuthButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const authScale = useAuthScale();
  const isDisabled = !!disabled || !!loading;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => !isDisabled && animateTo(0.97)}
        onPressOut={() => !isDisabled && animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          authStyles.button,
          authScale.button,
          isDisabled && authStyles.buttonDisabled,
          Platform.OS === "web" ? ({ cursor: isDisabled ? "default" : "pointer" } as any) : null,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[authStyles.buttonText, { fontSize: authScale.button.fontSize }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
