import React, { forwardRef, useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import { Colors } from "@/theme/colors";
import { authStyles } from "./authStyles";
import { useAuthScale } from "./useAuthScale";

/**
 * Shared auth-form input — adds the purple focus ring from the design system
 * on top of a plain RN TextInput, without touching the caller's value/logic.
 * Forwards its ref so screens can chain focus (email -> password) and submit
 * the form from the last field's `onSubmitEditing`.
 */
const AuthTextInput = forwardRef<TextInput, TextInputProps>(function AuthTextInput(props, ref) {
  const [focused, setFocused] = useState(false);
  const scale = useAuthScale();

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={Colors.textMuted}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[authStyles.input, scale.input, focused && authStyles.inputFocused, props.style]}
    />
  );
});

export default AuthTextInput;
