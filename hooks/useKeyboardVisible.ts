import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * True while the native on-screen keyboard is up. Always false on web, where
 * mobile browsers draw the keyboard over the page instead of resizing it.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    // iOS fires the "will" events in time to hide UI before the slide starts.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
