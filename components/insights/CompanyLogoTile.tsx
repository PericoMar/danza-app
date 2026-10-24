import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '@/theme/colors';
import { DISPLAY, CHROME_GRADIENT_START, CHROME_GRADIENT_END } from '@/theme/companies';
import { getInitials } from '@/utils/initials';

const RADIUS_RATIO = 0.22; // corner radius as a share of the tile's side
const INITIALS_FONT_RATIO = 0.34;

interface CompanyLogoTileProps {
  name: string;
  imageUrl: string | null;
  size: number;
}

/**
 * The company's logo alone, with rounded corners and no frame behind it.
 * Without a logo it shows the company's initials on chrome. Decorative: the
 * company's name always sits next to it.
 */
export default function CompanyLogoTile({ name, imageUrl, size }: CompanyLogoTileProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const radius = Math.round(size * RADIUS_RATIO);

  return (
    <View
      style={[styles.tile, { width: size, height: size, borderRadius: radius }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      ) : (
        <>
          <LinearGradient
            colors={Gradients.chrome.colors}
            locations={Gradients.chrome.locations}
            start={CHROME_GRADIENT_START}
            end={CHROME_GRADIENT_END}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.initials, { fontSize: Math.round(size * INITIALS_FONT_RATIO) }]}>
            {initials}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: DISPLAY,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#3c3f47',
  },
});
