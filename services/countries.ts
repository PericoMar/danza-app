// services/countries.ts
// La tabla `countries` (ISO 3166-1 alpha-2 más las naciones del Reino Unido)
// es la referencia de países del proyecto desde el calendario de audiciones.
// Aquí vive su lectura, que ahora comparten el onboarding de Resources y el
// listado del directorio.
import { supabase } from '@/services/supabase';
import { TABLES } from '@/constants/tables';

export type Country = {
  iso_code: string;
  name: string;
};

export async function fetchCountries() {
  const { data, error } = await supabase
    .from(TABLES.COUNTRIES)
    .select('iso_code, name')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Country[];
}

/**
 * Los países que ya tienen regiones nuestras. Son los únicos donde una ficha
 * puede elegir región fija o varias; en el resto solo cabe `nationwide`, así
 * que el selector los separa en vez de ofrecer una lista vacía.
 */
export async function fetchCountriesWithRegions() {
  const { data, error } = await supabase
    .from(TABLES.REGIONS)
    .select('country_iso_code');

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => (row as { country_iso_code: string }).country_iso_code));
}
