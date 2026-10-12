import { supabase } from '@/services/supabase';
import type { Ad } from '@/types/ads';
import { deleteImage, extractStoragePath } from '@/services/storage';
import { STORAGE_BUCKETS } from '@/constants/storage';

const BUCKET = STORAGE_BUCKETS.MEDIA;

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
  image_url_desktop: string | null;
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

// ─── Marketing helpers ───────────────────────────────────────────────────────

/**
 * Appends attribution params to an ad's destination URL so the advertiser can
 * see traffic coming from the directory carousel in their own analytics.
 * Never overwrites params the advertiser already set; fails open on bad URLs.
 */
export function withAdUtm(url: string, ad: Pick<Ad, 'id' | 'title'>): string {
  try {
    const u = new URL(url);
    const params: Record<string, string> = {
      utm_source: 'danza-app',
      utm_medium: 'carousel',
      utm_campaign: 'companies_directory',
      utm_content: ad.id,
    };
    for (const [k, v] of Object.entries(params)) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export type AdEventType = 'impression' | 'click';

/**
 * Best-effort ad telemetry. Non-blocking, never throws.
 * Set EXPO_PUBLIC_ADS_EVENTS=true and create an `ad_events` table
 * (`ad_id uuid, type text, created_at timestamptz default now()`) to persist;
 * otherwise this just logs in dev. Swap the body for PostHog/GA4 when available.
 */
export function logAdEvent(type: AdEventType, ad: Pick<Ad, 'id' | 'title'>): void {
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[ads] ${type}`, ad.id, ad.title ?? '');
    }
    if (process.env.EXPO_PUBLIC_ADS_EVENTS === 'true') {
      void supabase
        .from('ad_events')
        .insert({ ad_id: ad.id, type })
        .then(() => {}, () => {});
    }
  } catch {
    /* telemetry must never break the UI */
  }
}

export async function deleteAd(id: string, imageUrl: string | null, imageUrlDesktop: string | null = null): Promise<void> {
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) throw error;

  // Best-effort: remove images from storage
  for (const url of [imageUrl, imageUrlDesktop]) {
    if (url) {
      const path = extractStoragePath(url, BUCKET);
      if (path) {
        try {
          await deleteImage(BUCKET, path);
        } catch {
          // Non-fatal: DB row is already deleted
        }
      }
    }
  }
}
