// hooks/useResource.ts
// Una ficha por su slug, con el guion de su tipo: la página pública se dibuja
// con la misma configuración que el onboarding, así que lo que se pregunta y
// lo que se muestra no pueden separarse.
import { useEffect, useState } from 'react';
import { fetchResourceBySlug, fetchResourceTypeFields } from '@/services/resources';
import { Resource, ResourceTypeField } from '@/types/resource';

export function useResource(slug: string | undefined) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [typeFields, setTypeFields] = useState<ResourceTypeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchResourceBySlug(slug);
        if (cancelled) return;
        setResource(row);

        if (row) {
          const fields = await fetchResourceTypeFields(row.type);
          if (!cancelled) setTypeFields(fields);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Could not load this profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { resource, typeFields, loading, error };
}
