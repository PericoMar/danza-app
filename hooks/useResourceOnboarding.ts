// hooks/useResourceOnboarding.ts
// Todo el estado del onboarding de un profesional: su ficha, el guion de su
// tipo y los catálogos que necesitan las pantallas. La pantalla solo pinta.
//
// Dos cosas que conviene entender antes de tocar esto:
//
//  * Antes del muro de cuenta no hay fila que guardar, así que el tipo y el
//    nombre viven en el dispositivo (`services/resourceDraft`). En cuanto hay
//    sesión se convierten en la fila y el borrador local se borra.
//  * Después, cada paso guarda solo sus campos con `save_resource`, y lo que
//    manda por dónde seguir es la propia base de datos (`next_field`), no un
//    contador de pasos en el cliente.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchDisciplines,
  fetchResourceByUser,
  fetchResourceTypeFields,
  fetchRegions,
  saveResource,
} from '@/services/resources';
import { fetchCountries, fetchCountriesWithRegions, type Country } from '@/services/countries';
import { markOnboardingCompleted } from '@/services/profile';
import {
  clearPendingResourceDraft,
  readPendingResourceDraft,
  writePendingResourceDraft,
  type PendingResourceDraft,
} from '@/services/resourceDraft';
import {
  Discipline,
  Region,
  Resource,
  ResourceField,
  ResourceStatus,
  ResourceType,
  ResourceTypeField,
} from '@/types/resource';
import { payloadForFields, type ResourceFormValues } from '@/utils/resourceOnboarding';
import { resourceErrorMessage } from '@/utils/resourceErrors';

export type OnboardingPhase =
  /** Cargando la ficha y el guion. */
  | 'loading'
  /** Sin cuenta y sin tipo: el selector de tipo. */
  | 'pick-type'
  /** Sin cuenta, con tipo: el nombre. */
  | 'name'
  /** Sin cuenta, con tipo y nombre: el muro. */
  | 'account'
  /** Con cuenta y ficha: las pantallas del guion. */
  | 'steps';

export function useResourceOnboarding() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [draft, setDraft] = useState<PendingResourceDraft | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [typeFields, setTypeFields] = useState<ResourceTypeField[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesWithRegions, setCountriesWithRegions] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Region[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evita que una respuesta tardía de un usuario anterior pise el estado.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const type: ResourceType | null = resource?.type ?? draft?.type ?? null;

  // ─── Carga inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [pending, countryRows, withRegions] = await Promise.all([
          readPendingResourceDraft(),
          fetchCountries(),
          fetchCountriesWithRegions(),
        ]);

        if (cancelled) return;
        setCountries(countryRows);
        setCountriesWithRegions(withRegions);

        if (!userId) {
          setDraft(pending);
          setResource(null);
          return;
        }

        let row = await fetchResourceByUser(userId);

        // Acaba de crear la cuenta con un borrador local esperando: esta es la
        // línea que hace que no pierda lo que ya había elegido.
        if (!row && pending) {
          const id = await saveResource({
            id: null,
            type: pending.type,
            name: pending.name?.trim() || pending.type,
          });
          await clearPendingResourceDraft();
          row = await fetchResourceByUser(userId);
          if (!row) throw new Error(`The profile was created (${id}) but could not be read back.`);
        }

        if (cancelled) return;
        setDraft(row ? null : pending);
        setResource(row);
      } catch (e: unknown) {
        if (!cancelled) setError(resourceErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ─── El guion del tipo elegido ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!type) {
      setTypeFields([]);
      return;
    }

    (async () => {
      try {
        const fields = await fetchResourceTypeFields(type);
        if (!cancelled) setTypeFields(fields);
      } catch (e: unknown) {
        if (!cancelled) setError(resourceErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type]);

  // ─── Catálogos que dependen de lo elegido ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const country = resource?.country_iso_code;

    if (!country) {
      setRegions([]);
      return;
    }

    (async () => {
      try {
        const rows = await fetchRegions(country);
        if (!cancelled) setRegions(rows);
      } catch (e: unknown) {
        if (!cancelled) setError(resourceErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resource?.country_iso_code]);

  useEffect(() => {
    let cancelled = false;
    const needsDisciplines = typeFields.some((f) => f.field === ResourceField.DISCIPLINES);
    if (!needsDisciplines) return;

    (async () => {
      try {
        const rows = await fetchDisciplines();
        if (!cancelled) setDisciplines(rows);
      } catch (e: unknown) {
        if (!cancelled) setError(resourceErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [typeFields]);

  // ─── Escrituras ──────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!userId) return null;
    const row = await fetchResourceByUser(userId);
    if (mounted.current) setResource(row);
    return row;
  }, [userId]);

  /**
   * Envuelve cada escritura: un único sitio donde se pone `saving`, se limpia
   * el error y se vuelve a leer la ficha (la vista recalcula el progreso y el
   * siguiente campo, así que leerla es la forma de no duplicar esa lógica).
   */
  const run = useCallback(
    async (write: () => Promise<unknown>) => {
      setSaving(true);
      setError(null);
      try {
        await write();
        await refresh();
        return true;
      } catch (e: unknown) {
        // Lo que viene de Postgres no se enseña tal cual: nombres de
        // constraints, no frases.
        if (mounted.current) setError(resourceErrorMessage(e));
        return false;
      } finally {
        if (mounted.current) setSaving(false);
      }
    },
    [refresh]
  );

  /** Paso 1. Sin cuenta todavía: se queda en el dispositivo. */
  const chooseType = useCallback(
    async (next: ResourceType) => {
      if (resource) return run(() => saveResource({ id: resource.id, type: next }));

      const updated = { ...(draft ?? { type: next }), type: next };
      setDraft(updated);
      await writePendingResourceDraft(updated);
      return true;
    },
    [draft, resource, run]
  );

  /** Paso 2. Idem: aún no hay fila donde guardarlo. */
  const chooseName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      if (resource) return run(() => saveResource({ id: resource.id, name: trimmed }));
      if (!draft?.type) return false;

      const updated = { ...draft, name: trimmed };
      setDraft(updated);
      await writePendingResourceDraft(updated);
      return true;
    },
    [draft, resource, run]
  );

  /**
   * El país se guarda sin esperar a "Continuar": de él dependen las regiones
   * que se ofrecen justo debajo, así que se guarda y se recargan. Lo elegido
   * antes deja de valer, porque una región pertenece a un país.
   */
  const saveCountry = useCallback(
    (isoCode: string) => {
      if (!resource) return Promise.resolve(false);
      return run(() =>
        saveResource({
          id: resource.id,
          country_iso_code: isoCode,
          region_scope: null,
          region_ids: [],
        })
      );
    },
    [resource, run]
  );

  /** Guarda solo los campos de una pantalla; el resto queda intacto. */
  const saveStep = useCallback(
    (fields: ResourceField[], values: ResourceFormValues) => {
      if (!resource) return Promise.resolve(false);
      return run(() =>
        saveResource({ id: resource.id, ...payloadForFields(fields, values) })
      );
    },
    [resource, run]
  );

  /** "Lo añado luego": se recuerda para no volver a plantárselo en el flujo. */
  const skipField = useCallback(
    (field: ResourceField) => {
      if (!resource) return Promise.resolve(false);
      const skipped = Array.from(new Set([...resource.skipped_fields, field]));
      return run(() => saveResource({ id: resource.id, skipped_fields: skipped }));
    },
    [resource, run]
  );

  const unskipField = useCallback(
    (field: ResourceField) => {
      if (!resource) return Promise.resolve(false);
      const skipped = resource.skipped_fields.filter((f) => f !== field);
      return run(() => saveResource({ id: resource.id, skipped_fields: skipped }));
    },
    [resource, run]
  );

  /** A revisión. La base de datos rechaza el envío si falta algo obligatorio. */
  const submitForReview = useCallback(() => {
    if (!resource) return Promise.resolve(false);
    return run(async () => {
      await saveResource({ id: resource.id, status: ResourceStatus.PENDING_REVIEW });
      if (userId) await markOnboardingCompleted(userId);
    });
  }, [resource, run, userId]);

  const phase: OnboardingPhase = loading
    ? 'loading'
    : resource
      ? 'steps'
      : !draft?.type
        ? 'pick-type'
        : !draft.name
          ? 'name'
          : 'account';

  return {
    phase,
    resource,
    draft,
    type,
    typeFields,
    countries,
    countriesWithRegions,
    regions,
    disciplines,
    loading,
    saving,
    error,
    chooseType,
    chooseName,
    saveCountry,
    saveStep,
    skipField,
    unskipField,
    submitForReview,
    refresh,
  };
}
