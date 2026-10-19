import { useCallback, useState } from "react";
import {
  isPageBackgroundSupported,
  readPageBackground,
  savePageBackground,
} from "@/utils/pageBackground";

/** The page-background try-out: the colour in use here, and a way to change it. */
export function usePageBackground() {
  const [color, setColor] = useState(readPageBackground);

  const choose = useCallback((hex: string) => {
    savePageBackground(hex);
    setColor(hex);
  }, []);

  return { color, choose, isSupported: isPageBackgroundSupported };
}
