import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, type Href, type LinkProps } from 'expo-router';
import HoverHint from '@/components/common/HoverHint';
import { useHoverHint } from '@/hooks/useHoverHint';
import { Colors } from '@/theme/colors';

const ICON_SIZE = 12;

interface CountryLinkProps {
  country: string;
  href: Href;
  textStyle?: StyleProp<TextStyle>;
  onPress?: LinkProps['onPress'];
}

/** What following the link does, said by the hint and by screen readers. */
export function countryLinkLabel(country: string): string {
  return `See all companies in ${country}`;
}

/**
 * A country that opens its companies listing. A real anchor, so a crawler can
 * follow it; `push` keeps the native stack from reordering. The magnifier says
 * it searches on every device; on web a hint spells it out on hover and on
 * keyboard focus.
 */
export default function CountryLink({ country, href, textStyle, onPress }: CountryLinkProps) {
  const anchorRef = useRef<View>(null);
  const hint = useHoverHint();
  const label = countryLinkLabel(country);

  return (
    <>
      <Link href={href} push asChild onPress={onPress}>
        <Pressable
          ref={anchorRef}
          accessibilityLabel={label}
          style={styles.link}
          {...hint.anchorProps}
        >
          {({ hovered }) => (
            <>
              <Text style={[styles.text, textStyle, hovered && styles.textHovered]} numberOfLines={1}>
                {country}
              </Text>
              <Ionicons name="search" size={ICON_SIZE} color={Colors.textMuted} />
            </>
          )}
        </Pressable>
      </Link>
      <HoverHint label={label} visible={hint.visible} anchorRef={anchorRef} {...hint.hintProps} />
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  text: {
    flexShrink: 1,
  },
  textHovered: {
    textDecorationLine: 'underline',
  },
});
