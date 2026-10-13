import { useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addHeroRingImage,
  deleteHeroRingImage,
  getHeroRingImages,
  reorderHeroRingImages,
} from '@/services/heroRing';
import { pickImage } from '@/services/imagePicker';
import { preloadImages } from '@/services/imagePreload';
import { moveItem } from '@/utils/arrays';
import { resolveHeroRingSources } from '@/utils/heroRing';
import { isMissingTableError } from '@/utils/dbErrors';
import {
  HERO_RING_MAX_IMAGES,
  HERO_RING_PRELOAD_TIMEOUT_MS,
  HERO_RING_STALE_TIME_MS,
} from '@/constants/heroRing';
import { HeroRingAction, type HeroRingImage } from '@/types/heroRing';
import type { PickedImage } from '@/types/media';

export const heroRingKeys = {
  list: ['hero-ring-images'] as const,
  preload: (uris: string[]) => ['hero-ring-images-preload', uris] as const,
};

/** The configured ring photos, in ring order. */
export function useHeroRingImages() {
  return useQuery({
    queryKey: heroRingKeys.list,
    queryFn: getHeroRingImages,
    staleTime: HERO_RING_STALE_TIME_MS,
    // The landing falls back to the bundled photos on error, so fail fast
    // rather than keep the ring empty through the default backoff.
    retry: 1,
  });
}

/**
 * Sources for the Companies hero ring, or null while they're not ready yet.
 * Configured photos are downloaded before they're returned, so the ring blooms
 * in with them already painted.
 */
export function useHeroRingSources(): ImageSourcePropType[] | null {
  const list = useHeroRingImages();
  const uris = useMemo(() => (list.data ?? []).map((image) => image.image_url), [list.data]);

  const preload = useQuery({
    queryKey: heroRingKeys.preload(uris),
    queryFn: () => preloadImages(uris, HERO_RING_PRELOAD_TIMEOUT_MS).then(() => true),
    enabled: uris.length > 0,
    staleTime: Infinity,
  });

  return useMemo(
    () =>
      resolveHeroRingSources({
        images: list.data,
        failed: list.isError,
        preloaded: preload.isSuccess,
      }),
    [list.data, list.isError, preload.isSuccess]
  );
}

/** Admin editing of the ring photos: add from the library, remove, move one step. */
export function useHeroRingEditor() {
  const queryClient = useQueryClient();
  const list = useHeroRingImages();
  const images = list.data ?? [];
  const [failedAction, setFailedAction] = useState<HeroRingAction | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: heroRingKeys.list });

  const add = useMutation({
    mutationFn: (picked: PickedImage) => addHeroRingImage(picked, nextPosition(images)),
    onError: () => setFailedAction(HeroRingAction.ADD),
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: deleteHeroRingImage,
    onError: () => setFailedAction(HeroRingAction.REMOVE),
    onSettled: refresh,
  });

  const reorder = useMutation({
    mutationFn: (ordered: HeroRingImage[]) => reorderHeroRingImages(ordered.map((image) => image.id)),
    // Show the new order straight away; put the old one back if saving fails.
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: heroRingKeys.list });
      const previous = queryClient.getQueryData<HeroRingImage[]>(heroRingKeys.list);
      queryClient.setQueryData<HeroRingImage[]>(
        heroRingKeys.list,
        ordered.map((image, position) => ({ ...image, position }))
      );
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      queryClient.setQueryData(heroRingKeys.list, context?.previous);
      setFailedAction(HeroRingAction.REORDER);
    },
    onSettled: refresh,
  });

  const isBusy = add.isPending || remove.isPending || reorder.isPending;

  const addFromLibrary = async () => {
    setFailedAction(null);
    const picked = await pickImage({ square: true });
    if (picked) add.mutate(picked);
  };

  const removeImage = (image: HeroRingImage) => {
    setFailedAction(null);
    remove.mutate(image);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const ordered = moveItem(images, index, direction);
    if (ordered === images) return;
    setFailedAction(null);
    reorder.mutate(ordered);
  };

  return {
    images,
    isLoading: list.isLoading,
    loadError: list.error,
    /** The table isn't there yet: the hero ring migration hasn't been applied to this database. */
    isMissingTable: isMissingTableError(list.error),
    isRetrying: list.isFetching,
    retry: () => list.refetch(),
    isAdding: add.isPending,
    removingId: remove.isPending ? remove.variables?.id ?? null : null,
    isBusy,
    canAdd: images.length < HERO_RING_MAX_IMAGES && !isBusy,
    failedAction,
    addFromLibrary,
    removeImage,
    moveImage,
  };
}

/** One past the highest position, so a new photo goes last even if positions have gaps. */
function nextPosition(images: HeroRingImage[]): number {
  return images.reduce((next, image) => Math.max(next, image.position + 1), 0);
}
