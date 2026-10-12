import { supabase } from '@/services/supabase';

/**
 * Raw registration timestamps for every user, oldest first. Admin-only stats
 * screen buckets these client-side by day/week/month.
 *
 * `users` RLS only lets a row's owner read it, so this calls the
 * `get_user_registration_dates` RPC (SECURITY DEFINER, gated on `is_admin()`
 * — see supabase/migrations/20260914_admin_user_registration_stats.sql)
 * instead of selecting from the table directly.
 */
export async function getUserRegistrationDates(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_user_registration_dates');

  if (error) throw error;
  return (data ?? []).map((row: { created_at: string }) => row.created_at);
}
