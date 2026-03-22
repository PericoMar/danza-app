import { supabase } from '@/services/supabase';
import type { Ad } from '@/types/ads';
import { deleteImage, extractStoragePath } from '@/services/storage';

const BUCKET = 'media';

export async function getAds(): Promise<Ad[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAd(id: string): Promise<Ad> {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPublishedAds(): Promise<Ad[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

type AdInput = {
  title: string | null;
  description: string | null;
  image_url: string;
  destination_url: string | null;
  active_from: string | null;
  active_until: string | null;
  published: boolean;
};

export async function createAd(input: AdInput): Promise<Ad> {
  const { data, error } = await supabase
    .from('ads')
    .insert([input])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAd(id: string, input: Partial<AdInput>): Promise<Ad> {
  const { data, error } = await supabase
    .from('ads')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAd(id: string, imageUrl: string | null): Promise<void> {
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) throw error;

  // Best-effort: remove the image from storage
  if (imageUrl) {
    const path = extractStoragePath(imageUrl, BUCKET);
    if (path) {
      try {
        await deleteImage(BUCKET, path);
      } catch {
        // Non-fatal: DB row is already deleted
      }
    }
  }
}
