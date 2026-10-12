import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme/colors';
import { INTER, pageMaxWidth, pageHPadding } from '@/theme/companies';

/**
 * The site-wide page footer — a hairline rule, a copyright line, and the small
 * navigation row. Rendered as the last child inside a screen's scroll content.
 * Navigation is wired here, so callers just drop in `<SiteFooter />`.
 */
export default function SiteFooter() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const links = [
    { label: 'Policies', onPress: () => router.push('/policies') },
    { label: 'Privacy', onPress: () => router.push('/policies/privacy-policy') },
    { label: 'Terms', onPress: () => router.push('/policies/terms') },
    { label: 'Contact', onPress: () => router.push('/support') },
  ];

  return (
    <View style={[styles.footer, { paddingHorizontal: pageHPadding(width) }]}>
      <View style={[styles.inner, { maxWidth: pageMaxWidth(width) }]}>
        <Text style={styles.text}>© 2026 Danza App · For dancers and companies</Text>
        <View style={styles.links}>
          {links.map(({ label, onPress }) => (
            <Pressable
              key={label}
              onPress={onPress}
              accessibilityRole="link"
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
            >
              {({ hovered }) => (
                <Text style={[styles.text, hovered && styles.linkHovered]}>{label}</Text>
              )}
            </Pressable>
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
