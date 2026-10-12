import React from 'react';
import { Platform, Text, StyleProp, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Gradients } from '@/theme/colors';
import {
  HEADLINE_GRADIENT_START,
  HEADLINE_GRADIENT_END,
  webTextGradient,
} from '@/theme/companies';

interface GradientTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Silver "chrome" headline text (Gradients.headline). Web fills the glyphs
 * with a CSS background-clip gradient; native has no text-fill equivalent,
 * so it masks a LinearGradient with the same text shape via MaskedView.
 */
export default function GradientText({ children, style }: GradientTextProps) {
  if (Platform.OS === 'web') {
    return <Text style={[style, webTextGradient(Gradients.headline.css)]}>{children}</Text>;
  }

  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient
        colors={Gradients.headline.colors}
        locations={Gradients.headline.locations}
        start={HEADLINE_GRADIENT_START}
        end={HEADLINE_GRADIENT_END}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
