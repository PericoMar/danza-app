import { supabase } from '@/services/supabase';
import { buildImagePath, deleteImage, extractStoragePath, pickedImageName, uploadImage } from '@/services/storage';
import { compressImage } from '@/services/imageCompression';
import { IMMUTABLE_CACHE_CONTROL, STORAGE_BUCKETS } from '@/constants/storage';
import { RPC, TABLES } from '@/constants/tables';
import { HERO_RING_IMAGE_MAX_SIZE, HERO_RING_STORAGE_FOLDER } from '@/constants/heroRing';
import type { HeroRingImage } from '@/types/heroRing';
import type { PickedImage } from '@/types/media';

const BUCKET = STORAGE_BUCKETS.MEDIA;
const COLUMNS = 'id, image_url, position';

/** Photos for the Companies hero ring, in ring order. Empty = use the bundled ones. */
export async function getHeroRingImages(): Promise<HeroRingImage[]> {
  const { data, error } = await supabase
    .from(TABLES.HERO_RING_IMAGES)
    .select(COLUMNS)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Compresses and uploads a photo, then adds it to the ring at `position`.
 * The upload path is unique, so the file is cached as immutable.
 */
export async function addHeroRingImage(image: PickedImage, position: number): Promise<HeroRingImage> {
  const file = await compressImage(image, { maxSize: HERO_RING_IMAGE_MAX_SIZE });
  const path = buildImagePath(HERO_RING_STORAGE_FOLDER, pickedImageName(file));
  const imageUrl = await uploadImage(BUCKET, path, file, { cacheControl: IMMUTABLE_CACHE_CONTROL });

  const { data, error } = await supabase
    .from(TABLES.HERO_RING_IMAGES)
    .insert({ image_url: imageUrl, position })
    .select(COLUMNS)
    .single();

  if (error) {
    // Don't leave an orphan file behind.
    await deleteImage(BUCKET, path).catch(() => {});
    throw error;
  }
  return data;
}

/** Removes a photo from the ring, then (best-effort) its file from storage. */
export async function deleteHeroRingImage(image: HeroRingImage): Promise<void> {
  const { error } = await supabase.from(TABLES.HERO_RING_IMAGES).delete().eq('id', image.id);
  if (error) throw error;

  const path = extractStoragePath(image.image_url, BUCKET);
  if (path) {
    // Non-fatal: the row is already gone, so the photo is off the ring either way.
    await deleteImage(BUCKET, path).catch(() => {});
  }
}

/** Saves a new ring order: `ids` from first to last. */
export async function reorderHeroRingImages(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc(RPC.REORDER_HERO_RING_IMAGES, { p_ids: ids });
  if (error) throw error;
}
