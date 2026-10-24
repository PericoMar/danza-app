import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, type NativeSyntheticEvent, type TargetedEvent } from 'react-native';

// Long enough for the pointer to cross the gap between the anchor and the hint.
const HIDE_DELAY_MS = 120;

/** True only for a mouse or trackpad: touch screens have no hover to show a hint on. */
function canHover(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/** True when focus came from the keyboard rather than from a click or a tap. */
function isKeyboardFocus(e: NativeSyntheticEvent<TargetedEvent>): boolean {
  const target = e.target as unknown as Element | null;
  return typeof target?.matches === 'function' && target.matches(':focus-visible');
}

/**
 * When to show a hover hint (see `HoverHint`), web only: on hover with a fine
 * pointer and on keyboard focus. Spread `anchorProps` onto the Pressable that
 * triggers it and `hintProps` onto the hint, so the pointer can move onto the
 * hint without it closing. Escape dismisses it. Never visible on native.
 */
export function useHoverHint() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const show = useCallback(() => {
    cancelHide();
    setVisible(true);
  }, [cancelHide]);

  const hideSoon = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
  }, [cancelHide]);

  const hideNow = useCallback(() => {
    cancelHide();
    setVisible(false);
  }, [cancelHide]);

  const onHoverIn = useCallback(() => {
    if (canHover()) show();
  }, [show]);

  const onFocus = useCallback(
    (e: NativeSyntheticEvent<TargetedEvent>) => {
      if (isKeyboardFocus(e)) show();
    },
    [show],
  );

  useEffect(() => cancelHide, [cancelHide]);

  useEffect(() => {
    if (!visible || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideNow();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, hideNow]);

  return {
    visible,
    anchorProps: { onHoverIn, onHoverOut: hideSoon, onFocus, onBlur: hideNow },
    hintProps: { onHoverIn: cancelHide, onHoverOut: hideSoon },
  };
}
