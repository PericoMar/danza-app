import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import type { PickedImage } from '@/types/media';

type UploadOptions = {
  /** Cache-Control max-age in seconds. Supabase defaults to one hour. */
  cacheControl?: string;
};

export async function uploadImage(
  bucket: string,
  path: string,
  file: PickedImage,
  { cacheControl }: UploadOptions = {}
): Promise<string> {
  // On native, Supabase storage needs an ArrayBuffer rather than the picked
  // file's `uri` — passing a Blob/File-like object silently uploads 0 bytes
  // on Hermes. Web keeps using the native File straight from the <input>.
  const body: File | ArrayBuffer =
    Platform.OS === 'web'
      ? (file as File)
      : await fetch((file as { uri: string }).uri).then((res) => res.arrayBuffer());

  const contentType = Platform.OS === 'web' ? undefined : (file as { type: string }).type;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      upsert: true,
      ...(contentType ? { contentType } : {}),
      ...(cacheControl ? { cacheControl } : {}),
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// Extracts the storage path from a Supabase public URL.
// e.g. "https://xxx.supabase.co/storage/v1/object/public/media/ads/123-img.png"
// returns "ads/123-img.png"
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    return idx === -1 ? null : publicUrl.slice(idx + marker.length);
  } catch {
    return null;
  }
}

// File name of a picked image, on either platform.
export function pickedImageName(image: PickedImage): string {
  return Platform.OS === 'web' ? (image as File).name : (image as { name: string }).name;
}

// Builds a unique storage path for an uploaded file. Pass `id` to scope the
// file under its owning entity's folder (e.g. a company id) — this keeps
// every upload for that entity together, which is what makes bulk cleanup
// (e.g. on delete) reliable.
export function buildImagePath(folder: string, filename: string, id?: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const scope = id ? `${folder}/${id}` : folder;
  return `${scope}/${timestamp}-${sanitized}`;
}
