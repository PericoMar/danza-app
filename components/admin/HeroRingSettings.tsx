import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ImageRing from '@/components/companies/ImageRing';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { AccountButton, accountStyles } from '@/components/account';
import HeroRingImageTile from './HeroRingImageTile';
import { useHeroRingEditor } from '@/hooks/useHeroRingImages';
import { resolveHeroRingSources } from '@/utils/heroRing';
import {
  DEFAULT_HERO_RING_IMAGES,
  HERO_RING_MAX_IMAGES,
  HERO_RING_RECOMMENDED_IMAGES,
} from '@/constants/heroRing';
import { HERO_RING_PREVIEW_MAX_WIDTH } from '@/constants/layout';
import { HeroRingAction, type HeroRingImage } from '@/types/heroRing';
import { Colors } from '@/theme/colors';

const ERROR_COPY: Record<HeroRingAction, string> = {
  [HeroRingAction.ADD]: "Couldn't upload the photo. Please try again.",
  [HeroRingAction.REMOVE]: "Couldn't remove the photo. Please try again.",
  [HeroRingAction.REORDER]: "Couldn't save the new order. Please try again.",
};

const positionLabel = (index: number) => String(index + 1).padStart(2, '0');

/** Editor for the Companies hero ring photos: live preview, ordered list, add / move / remove. */
export default function HeroRingSettings({ isWide }: { isWide: boolean }) {
  const {
    images,
    isLoading,
    loadError,
    isMissingTable,
    isRetrying,
    retry,
    isAdding,
    removingId,
    isBusy,
    canAdd,
    failedAction,
    addFromLibrary,
    removeImage,
    moveImage,
  } = useHeroRingEditor();
  const [previewWidth, setPreviewWidth] = useState(0);
  const [pendingRemoval, setPendingRemoval] = useState<HeroRingImage | null>(null);

  if (isLoading) return <ActivityIndicator color={Colors.text} style={styles.loader} />;
  if (loadError) {
    return (
      <View style={styles.footer}>
        <Text style={accountStyles.errorText}>
          {isMissingTable
            ? "The database isn't set up for ring photos yet: the hero_ring_images migration hasn't been applied. The landing keeps showing the default photos until it is."
            : "Couldn't load the ring photos. Check your connection and try again."}
        </Text>
        <AccountButton
          variant="ghost"
          icon="refresh"
          label="Try again"
          onPress={retry}
          loading={isRetrying}
          fullWidth={!isWide}
        />
      </View>
    );
  }

  const usingDefaults = images.length === 0;
  const previewSources = resolveHeroRingSources({ images, failed: false, preloaded: true }) ?? [];
  const isFull = images.length >= HERO_RING_MAX_IMAGES;

  const confirmRemoval = () => {
    if (pendingRemoval) removeImage(pendingRemoval);
    setPendingRemoval(null);
  };

  return (
    <View style={styles.body}>
      <View style={styles.preview}>
        <View
          style={styles.previewStage}
          onLayout={(e) => setPreviewWidth(Math.min(e.nativeEvent.layout.width, HERO_RING_PREVIEW_MAX_WIDTH))}
        >
          {previewWidth > 0 && <ImageRing images={previewSources} width={previewWidth} />}
        </View>
      </View>

      <Text style={accountStyles.hintText}>
        {usingDefaults
          ? "The ring is showing the app's default photos. Add your own to replace them all."
          : `${images.length} of ${HERO_RING_MAX_IMAGES} photos. ${HERO_RING_RECOMMENDED_IMAGES} looks best.`}
      </Text>

      <View style={styles.grid}>
        {usingDefaults
          ? DEFAULT_HERO_RING_IMAGES.map((source, i) => (
              <HeroRingImageTile key={i} source={source} label="Default" muted />
            ))
          : images.map((image, i) => (
              <HeroRingImageTile
                key={image.id}
                source={{ uri: image.image_url }}
                label={positionLabel(i)}
                busy={removingId === image.id}
                actions={{
                  onMoveBack: i > 0 ? () => moveImage(i, -1) : undefined,
                  onMoveForward: i < images.length - 1 ? () => moveImage(i, 1) : undefined,
                  onRemove: () => setPendingRemoval(image),
                  disabled: isBusy,
                }}
              />
            ))}
      </View>

      <View style={styles.footer}>
        <AccountButton
          label="Add photo"
          icon="add"
          onPress={addFromLibrary}
          loading={isAdding}
          disabled={!canAdd}
          fullWidth={!isWide}
        />
        <Text style={accountStyles.hintText}>
          {isFull
            ? 'The ring is full. Remove a photo to add another.'
            : 'Photos are cropped to a circle, so keep the subject in the middle.'}
        </Text>
        {failedAction && <Text style={accountStyles.errorText}>{ERROR_COPY[failedAction]}</Text>}
      </View>

      <ConfirmDialog
        visible={pendingRemoval !== null}
        title="Remove this photo?"
        message={
          images.length === 1
            ? "It's the last one, so the ring will go back to the default photos."
            : 'It will disappear from the ring for everyone.'
        }
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    alignSelf: 'flex-start',
  },
  body: {
    gap: 18,
  },
  preview: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.specSurface,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  previewStage: {
    width: '100%',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  footer: {
    gap: 10,
  },
});
