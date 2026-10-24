import { Colors } from "@/theme/colors";
import type { ToastToneStyle } from "@/components/toast/tones";

/** The favourite toasts follow the heart: pink when added, plain white when removed. */
export const FAVORITE_ADDED_TOAST: ToastToneStyle = {
  icon: "heart",
  accent: Colors.pink,
  soft: Colors.pinkTint,
  softBorder: Colors.pinkBorder,
  softText: Colors.pinkDark,
};

export const FAVORITE_REMOVED_TOAST: ToastToneStyle = {
  icon: "heart-outline",
  accent: Colors.grey1,
  soft: Colors.white,
  softBorder: Colors.silverSoft,
  softText: Colors.grey1,
};
