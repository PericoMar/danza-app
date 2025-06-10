// FlagCdn.tsx
import { Image, StyleProp, ImageStyle } from 'react-native';

export const FlagCdn = ({
  iso,
  size = 32,
  style,
}: {
  iso: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) => (
  <Image
    source={{ uri: `https://flagcdn.com/w${size}/${iso.toLowerCase()}.webp` }}
    style={[
      { width: size, height: (size * 2) / 3, borderRadius: 2 },
      style,
    ]}
    alt={`Bandera de ${iso}`}
  />
);