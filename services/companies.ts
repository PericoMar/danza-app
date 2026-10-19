import { supabase } from '@/services/supabase';
import { RPC, VIEWS } from '@/constants/tables';
import type { CompanyFormValues, CompanySubtypeId, SaveCompanyPayload } from '@/types/company';

const FORM_COLUMNS =
  'name,description,image,location,website_url,instagram_url,meta_url,country,country_iso_code,verified,subtypes';

/** A company as the admin form edits it, or null when no company has that id. */
export async function fetchCompanyFormValues(companyId: string): Promise<CompanyFormValues | null> {
  const { data, error } = await supabase
    .from(VIEWS.COMPANIES_ENRICHED)
    .select(FORM_COLUMNS)
    .eq('id', companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    name: data.name ?? '',
    description: data.description ?? '',
    image: data.image ?? '',
    location: data.location ?? '',
    website_url: data.website_url ?? '',
    instagram_url: data.instagram_url ?? '',
    meta_url: data.meta_url ?? '',
    country: data.country ?? '',
    country_iso_code: (data.country_iso_code ?? '').toUpperCase(),
    verified: data.verified ?? true,
    subtype_ids: Array.isArray(data.subtypes) ? (data.subtypes as CompanySubtypeId[]) : [],
  };
}

/** Creates (`id` null) or updates a company together with its subtypes. Returns its id. */
export async function saveCompany(payload: SaveCompanyPayload): Promise<string> {
  const { data, error } = await supabase.rpc(RPC.SAVE_COMPANY, { p: payload });
  if (error) throw error;
  return data as string;
}
