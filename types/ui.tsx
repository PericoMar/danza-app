// types/ui.ts
import { Ionicons } from "@expo/vector-icons";

export type SnackbarState = {
  message: string;
  color?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
} | null;
