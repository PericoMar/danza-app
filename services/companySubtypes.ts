import { supabase } from '@/services/supabase';
import { TABLES } from '@/constants/tables';
import type { CompanySubtypeGroup } from '@/types/company';

/**
 * The subtype catalogue, grouped under its types, both in catalogue order.
 * Types with no subtype are left out: there is nothing to tick under them.
 */
export async function getCompanySubtypeGroups(): Promise<CompanySubtypeGroup[]> {
  const { data, error } = await supabase
    .from(TABLES.COMPANY_TYPES)
    .select(`id, label, ${TABLES.COMPANY_SUBTYPES}(id, label)`)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
    .order('sort_order', { ascending: true, referencedTable: TABLES.COMPANY_SUBTYPES })
    .order('id', { ascending: true, referencedTable: TABLES.COMPANY_SUBTYPES });

  if (error) throw error;
  return (data ?? [])
    .map(({ id, label, company_subtypes }) => ({ id, label, subtypes: company_subtypes ?? [] }))
    .filter((group) => group.subtypes.length > 0);
}
