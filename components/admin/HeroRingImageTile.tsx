import React from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import ChromeSurface from '@/components/companies/ChromeSurface';
import IconButton from '@/components/common/IconButton';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

const SIZE = 92;
const BEZEL = 3;
const INNER = SIZE - BEZEL * 2;

export interface HeroRingImageTileActions {
  onMoveBack?: () => void;
  onMoveForward?: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

interface HeroRingImageTileProps {
  source: ImageSourcePropType;
  /** Shown under the photo, e.g. its position ("01") or "Default". */
  label: string;
  /** Spinner over the photo while it's being removed. */
  busy?: boolean;
  /** Without actions the tile is read-only (the bundled photos). */
  actions?: HeroRingImageTileActions;
  muted?: boolean;
}

/** One ring photo in the admin editor: the round crop the ring shows, plus move / remove. */
export default function HeroRingImageTile({ source, label, busy = false, actions, muted = false }: HeroRingImageTileProps) {
  const disabled = busy || actions?.disabled;

  return (
    <View style={[styles.tile, muted && styles.muted]}>
      <ChromeSurface ring={false} borderRadius={SIZE / 2} style={styles.bezel}>
        <View style={styles.photo}>
          <Image source={source} style={styles.image} resizeMode="cover" />
          {busy && (
            <View style={[StyleSheet.absoluteFill, styles.busy]}>
              <ActivityIndicator color={Colors.white} />
            </View>
          )}
        </View>
      </ChromeSurface>

      <Text style={styles.label}>{label}</Text>

      {actions && (
        <View style={styles.actions}>
          <IconButton
            name="chevron-back"
            size={16}
            color={Colors.text}
            onPress={actions.onMoveBack}
            disabled={disabled || !actions.onMoveBack}
            accessibilityLabel={`Move photo ${label} earlier`}
          />
          <IconButton
            name="trash-outline"
            size={16}
            color={Colors.dangerText}
            onPress={actions.onRemove}
            disabled={disabled}
            accessibilityLabel={`Remove photo ${label}`}
          />
          <IconButton
            name="chevron-forward"
            size={16}
            color={Colors.text}
            onPress={actions.onMoveForward}
            disabled={disabled || !actions.onMoveForward}
            accessibilityLabel={`Move photo ${label} later`}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: SIZE + 16,
    alignItems: 'center',
    gap: 8,
  },
  muted: {
    opacity: 0.55,
  },
  bezel: {
    width: SIZE,
    height: SIZE,
    padding: BEZEL - 1,
  },
  photo: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    overflow: 'hidden',
  },
  image: {
    width: INNER,
    height: INNER,
  },
  busy: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
