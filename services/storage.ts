import { supabase } from '@/services/supabase';

export async function uploadImage(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

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

// Builds a unique storage path for an uploaded file.
export function buildImagePath(folder: string, filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${folder}/${timestamp}-${sanitized}`;
}
