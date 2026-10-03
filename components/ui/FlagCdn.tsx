// FlagCdn.tsx
import { Image, StyleProp, ImageStyle } from 'react-native';

// flagcdn.com only serves specific raster widths — snap the requested display
// size up to the nearest available one so the URL always resolves.
const CDN_WIDTHS = [20, 40, 80, 160, 320, 640];

function nearestCdnWidth(size: number): number {
  const target = Math.ceil(size * 2); // a little headroom for retina
  return CDN_WIDTHS.find((w) => w >= target) ?? CDN_WIDTHS[CDN_WIDTHS.length - 1];
}

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
    source={{ uri: `https://flagcdn.com/w${nearestCdnWidth(size)}/${iso.toLowerCase()}.webp` }}
    style={[
      { width: size, height: (size * 2) / 3, borderRadius: 2 },
      style,
    ]}
    alt={`Bandera de ${iso}`}
  />
);
