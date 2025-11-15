// services/favorites.ts
import { supabase } from "@/services/supabase";

export type FavoriteRow = {
  user_id: string;
  company_id: string;
  created_at: string;
};

export async function isCompanyFavorite(companyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("favorite_companies")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

export async function addFavorite(companyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("favorite_companies").insert({
    user_id: user.id,
    company_id: companyId,
  });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeFavorite(companyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorite_companies")
    .delete()
    .eq("user_id", user.id)
    .eq("company_id", companyId);

  if (error) throw error;
}

export async function toggleFavorite(companyId: string, current: boolean) {
  if (current) {
    await removeFavorite(companyId);
    return false;
  } else {
    await addFavorite(companyId);
    return true;
  }
}

/** Listado de favoritos del usuario (IDs de compañías) */
export async function listMyFavoriteCompanyIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("favorite_companies")
    .select("company_id")
    .eq("user_id", user.id);

  if (error) throw error;
  return (data ?? []).map((r) => r.company_id);
}
