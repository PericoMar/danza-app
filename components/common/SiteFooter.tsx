import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/theme/colors';
import { INTER, pageMaxWidth, pageHPadding } from '@/theme/companies';
import {
  POLICIES_ROUTE,
  PRIVACY_POLICY_ROUTE,
  SUPPORT_ROUTE,
  TERMS_ROUTE,
} from '@/constants/routes';

const LINKS = [
  { label: 'Policies', href: POLICIES_ROUTE },
  { label: 'Privacy', href: PRIVACY_POLICY_ROUTE },
  { label: 'Terms', href: TERMS_ROUTE },
  { label: 'Contact', href: SUPPORT_ROUTE },
] as const;

/**
 * The site-wide page footer — a hairline rule, a copyright line, and the small
 * navigation row. Rendered as the last child inside a screen's scroll content.
 * Navigation is wired here, so callers just drop in `<SiteFooter />`.
 *
 * The rows are <Link>s rather than handlers so they reach the browser as real
 * anchors: a crawler can only follow a URL it can see in the markup, and this
 * footer is on nearly every page.
 */
export default function SiteFooter() {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.footer, { paddingHorizontal: pageHPadding(width) }]}>
      <View style={[styles.inner, { maxWidth: pageMaxWidth(width) }]}>
        <Text style={styles.text}>© 2026 Danza App · For dancers and companies</Text>
        <View style={styles.links}>
          {LINKS.map(({ label, href }) => (
            <Link key={label} href={href} asChild>
              <Pressable
                accessibilityRole="link"
                style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
              >
                {({ hovered }) => (
                  <Text style={[styles.text, hovered && styles.linkHovered]}>{label}</Text>
                )}
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    paddingVertical: 36,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  text: {
    fontFamily: INTER,
    fontSize: 10.5,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  links: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  linkHovered: {
    color: Colors.text,
  },
});
