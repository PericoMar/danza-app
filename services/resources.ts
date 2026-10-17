// services/resources.ts
// Único sitio que habla con Supabase sobre Resources. Los componentes y los
// hooks no conocen nombres de tablas ni de RPC: los leen de `constants/tables`.
import { supabase } from '@/services/supabase';
import { RPC, TABLES, VIEWS } from '@/constants/tables';
import {
  Discipline,
  Region,
  Resource,
  ResourceStatus,
  ResourceType,
  ResourceTypeField,
  SaveResourcePayload,
} from '@/types/resource';

// ---------------------------------------------------------------------------
// Configuración del onboarding y catálogos
// ---------------------------------------------------------------------------

/**
 * Qué se le pregunta a un tipo, en qué pantalla y en qué orden
 * (`resource_type_fields`). Lectura pública: las primeras pantallas del
 * onboarding corren sin sesión.
 */
export async function fetchResourceTypeFields(type: ResourceType) {
  const { data, error } = await supabase
    .from(TABLES.RESOURCE_TYPE_FIELDS)
    .select('type, field, step, position, is_required, min_count')
    .eq('type', type)
    .order('step', { ascending: true })
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ResourceTypeField[];
}

/** Las regiones de un país, en el orden del selector. */
export async function fetchRegions(countryIsoCode: string) {
  const { data, error } = await supabase
    .from(TABLES.REGIONS)
    .select('id, country_iso_code, name, slug, position')
    .eq('country_iso_code', countryIsoCode)
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Region[];
}

export async function fetchDisciplines() {
  const { data, error } = await supabase
    .from(TABLES.DISCIPLINES)
    .select('id, name, slug, position')
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Discipline[];
}

// ---------------------------------------------------------------------------
// Una ficha
// ---------------------------------------------------------------------------

/**
 * La ficha de una cuenta, publicada o no (RLS deja ver la propia). Es por
 * donde entra el onboarding: si devuelve null, el profesional aún no la ha
 * creado; si no, `next_field` dice por dónde sigue.
 */
export async function fetchResourceByUser(userId: string) {
  const { data, error } = await supabase
    .from(VIEWS.RESOURCES_ENRICHED)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Resource | null;
}

export async function fetchResource(resourceId: string) {
  const { data, error } = await supabase
    .from(VIEWS.RESOURCES_ENRICHED)
    .select('*')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Resource | null;
}

/** La ficha pública por su slug (la URL de `/resources/[slug]`). */
export async function fetchResourceBySlug(slug: string) {
  const { data, error } = await supabase
    .from(VIEWS.RESOURCES_ENRICHED)
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Resource | null;
}

/**
 * Guarda la ficha y todas sus hijas en una sola transacción. Una clave ausente
 * del payload deja lo guardado como está, así que el onboarding manda solo lo
 * de su paso. Devuelve el id (el de la ficha nueva en un alta).
 */
export async function saveResource(payload: SaveResourcePayload) {
  const { data, error } = await supabase.rpc(RPC.SAVE_RESOURCE, { p: payload });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Borra la ficha; regiones, emails, imágenes y selecciones caen en cascada. */
export async function deleteResource(resourceId: string) {
  const { error } = await supabase.from(TABLES.RESOURCES).delete().eq('id', resourceId);
  if (error) throw new Error(error.message);
  return true;
}

// ---------------------------------------------------------------------------
// Listados
// ---------------------------------------------------------------------------

/**
 * Las fichas publicadas que deben aparecer en una región, ya ordenadas: las de
 * región fija primero, luego las de varias y al final las nacionales. Es una
 * RPC y no una consulta porque el filtro pasa por `resource_region_placements`
 * (una ficha nacional no tiene fila en `resource_regions` y aun así sale).
 */
export async function fetchResourcesInRegion(regionId: string, type?: ResourceType) {
  const { data, error } = await supabase.rpc(RPC.RESOURCES_IN_REGION, {
    p_region_id: regionId,
    p_type: type ?? null,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as Resource[];
}

/**
 * Las fichas publicadas cuando no se ha elegido región: todas, o las de un
 * país, con el mismo orden de puesto que el listado por región.
 */
export async function fetchPublishedResources(filters: {
  countryIsoCode?: string;
  type?: ResourceType;
} = {}) {
  let query = supabase
    .from(VIEWS.RESOURCES_ENRICHED)
    .select('*')
    .eq('status', ResourceStatus.PUBLISHED)
    .order('placement_rank', { ascending: true })
    .order('verified', { ascending: false })
    .order('name', { ascending: true });

  if (filters.countryIsoCode) query = query.eq('country_iso_code', filters.countryIsoCode);
  if (filters.type) query = query.eq('type', filters.type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Resource[];
}

/**
 * Publica, oculta o devuelve a borrador una ficha. Es un UPDATE directo y no
 * la RPC porque es una sola columna y no hay hijas que tocar; las reglas de
 * quién puede hacerlo siguen donde deben estar (`resources_guard` deja
 * `published` solo a los admins y es quien pone `published_at`).
 */
export async function setResourceStatus(resourceId: string, status: ResourceStatus) {
  const { error } = await supabase
    .from(TABLES.RESOURCES)
    .update({ status })
    .eq('id', resourceId);

  if (error) throw new Error(error.message);
}

/** El sello de verificado. Igual que arriba: el trigger lo reserva a los admins. */
export async function setResourceVerified(resourceId: string, verified: boolean) {
  const { error } = await supabase
    .from(TABLES.RESOURCES)
    .update({ verified })
    .eq('id', resourceId);

  if (error) throw new Error(error.message);
}

/**
 * Fichas por estado, para la cola de revisión del admin. RLS ya se encarga de
 * que solo un admin vea las que no están publicadas.
 */
export async function fetchResourcesByStatus(status: ResourceStatus) {
  const { data, error } = await supabase
    .from(VIEWS.RESOURCES_ENRICHED)
    .select('*')
    .eq('status', status)
    .order('updated_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Resource[];
}
