import React, { useEffect, useState, type RefObject } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import {
  HOVER_HINT_MAX_WIDTH,
  HOVER_HINT_OFFSET,
  HOVER_HINT_SCREEN_MARGIN,
} from '@/constants/layout';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Size {
  width: number;
  height: number;
}

interface HoverHintProps {
  label: string;
  visible: boolean;
  anchorRef: RefObject<View>;
  onHoverIn: () => void;
  onHoverOut: () => void;
}

/** Below the anchor if it fits, otherwise above; never past a screen edge. */
function placeHint(anchor: Rect, hint: Size, screen: Size) {
  const maxLeft = screen.width - HOVER_HINT_SCREEN_MARGIN - hint.width;
  const left = Math.max(HOVER_HINT_SCREEN_MARGIN, Math.min(anchor.x, maxLeft));
  const below = anchor.y + anchor.h + HOVER_HINT_OFFSET;
  const fitsBelow = below + hint.height <= screen.height - HOVER_HINT_SCREEN_MARGIN;
  const top = fitsBelow ? below : anchor.y - HOVER_HINT_OFFSET - hint.height;
  return { left, top };
}

/**
 * A short tooltip floating next to `anchorRef`, driven by `useHoverHint`.
 * Hidden from screen readers: the anchor's own label must already say it.
 */
export default function HoverHint({ label, visible, anchorRef, onHoverIn, onHoverOut }: HoverHintProps) {
  const screen = useWindowDimensions();
  const [anchor, setAnchor] = useState<Rect | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!visible) {
      setAnchor(null);
      return;
    }
    anchorRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      setAnchor({ x: pageX, y: pageY, w, h });
    });
  }, [visible, anchorRef]);

  if (!visible) return null;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const position = anchor && size ? placeHint(anchor, size, screen) : null;

  return (
    <Portal>
      <Pressable
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        onLayout={onLayout}
        focusable={false}
        aria-hidden
        style={[styles.hint, position ?? styles.unplaced]}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Portal>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 10px 24px -12px rgba(0,0,0,0.35)' },
  default: {},
}) as object;

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    maxWidth: HOVER_HINT_MAX_WIDTH,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.text,
    ...shadow,
  },
  // Rendered once off-screen so its size is known before it is placed.
  unplaced: {
    top: 0,
    left: 0,
    opacity: 0,
  },
  label: {
    fontFamily: INTER,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
    color: Colors.white,
  },
});
