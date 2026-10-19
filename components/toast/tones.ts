import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { NL } from "@/components/newsletter/styles";
import { ToastTone } from "@/constants/toast";

export type ToastToneStyle = {
  icon: ComponentProps<typeof Ionicons>["name"];
  /** Saturated colour for the icon and the timer line. */
  accent: string;
  /** Pastel fill, its hairline and the text that sits on it. */
  soft: string;
  softBorder: string;
  softText: string;
};

/**
 * One palette per tone, the design system's recipe for status: a pastel fill
 * with saturated text, never a loud solid. Info borrows the sitewide purple.
 */
export const TOAST_TONES: Record<ToastTone, ToastToneStyle> = {
  [ToastTone.SUCCESS]: {
    icon: "checkmark-circle",
    accent: "#16A34A",
    soft: Colors.successBg,
    softBorder: Colors.successBorder,
    softText: Colors.successText,
  },
  [ToastTone.ERROR]: {
    icon: "close-circle",
    accent: "#DC2626",
    soft: "#FEF2F2",
    softBorder: Colors.dangerSoft,
    softText: Colors.dangerText,
  },
  [ToastTone.WARNING]: {
    icon: "alert-circle",
    accent: "#D97706",
    soft: NL.warnBg,
    softBorder: NL.warnBorder,
    softText: NL.warnText,
  },
  [ToastTone.INFO]: {
    icon: "information-circle",
    accent: Colors.purple,
    soft: Colors.purpleLight,
    softBorder: Colors.surfaceAlt,
    softText: Colors.purpleDark,
  },
};
