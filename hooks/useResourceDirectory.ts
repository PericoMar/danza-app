// hooks/useResourceDirectory.ts
// El estado del directorio: país, región y tipo, y las fichas que salen de esa
// combinación.
//
// Con región elegida se llama a `resources_in_region`, que es lo único que
// sabe incluir a las fichas nacionales (no tienen fila en `resource_regions`) y
// ordenarlas por puesto. Sin región, una consulta normal con el mismo orden.
import { useCallback, useEffect, useState } from 'react';
import { fetchPublishedResources, fetchRegions, fetchResourcesInRegion } from '@/services/resources';
import { fetchCountries, type Country } from '@/services/countries';
import { Region, Resource, ResourceType } from '@/types/resource';

export function useResourceDirectory() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [countryIsoCode, setCountryIsoCode] = useState('');
  const [regionId, setRegionId] = useState('');
  const [type, setType] = useState<ResourceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchCountries();
        if (!cancelled) setCountries(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Could not load the countries.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Las regiones del país elegido; sin país, no hay regiones que ofrecer.
  useEffect(() => {
    let cancelled = false;

    if (!countryIsoCode) {
      setRegions([]);
      return;
    }

    (async () => {
      try {
        const rows = await fetchRegions(countryIsoCode);
        if (!cancelled) setRegions(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Could not load the regions.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [countryIsoCode]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = regionId
          ? await fetchResourcesInRegion(regionId, type ?? undefined)
          : await fetchPublishedResources({
              countryIsoCode: countryIsoCode || undefined,
              type: type ?? undefined,
            });
        if (!cancelled) setResources(rows);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Could not load the directory.');
          setResources([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [countryIsoCode, regionId, type]);

  /** Cambiar de país deja sin sentido la región elegida. */
  const chooseCountry = useCallback((isoCode: string) => {
    setCountryIsoCode(isoCode);
    setRegionId('');
  }, []);

  const toggleRegion = useCallback(
    (id: string) => setRegionId((current) => (current === id ? '' : id)),
    []
  );

  const toggleType = useCallback(
    (next: ResourceType) => setType((current) => (current === next ? null : next)),
    []
  );

  return {
    countries,
    regions,
    resources,
    countryIsoCode,
    regionId,
    type,
    loading,
    error,
    chooseCountry,
    toggleRegion,
    toggleType,
  };
}
