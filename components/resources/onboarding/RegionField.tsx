import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import { accountStyles } from '@/components/account';
import ChoiceCard from '@/components/resources/ChoiceCard';
import SelectChips from '@/components/resources/SelectChips';
import { REGION_SCOPE_COPY, REGION_SCOPE_DISCLAIMER } from '@/constants/resourceOnboarding';
import { REGION_COUNT_BY_SCOPE, Region, ResourceRegionScope } from '@/types/resource';

const SCOPES: ResourceRegionScope[] = [
  ResourceRegionScope.FIXED,
  ResourceRegionScope.MULTIPLE,
  ResourceRegionScope.NATIONWIDE,
];

interface RegionScopeFieldProps {
  /** Regiones del país ya guardado; vacío si aún no hemos añadido las de ese país. */
  regions: Region[];
  regionScope: ResourceRegionScope | null;
  regionIds: string[];
  onScopeChange: (scope: ResourceRegionScope) => void;
  onRegionIdsChange: (ids: string[]) => void;
  /** Sin país elegido no hay nada que decidir todavía. */
  hasCountry: boolean;
}

/**
 * El alcance y sus regiones, con la regla a la vista: se enseña al elegir y no
 * escondida en un aviso al final, porque es lo que evita que todo el mundo se
 * ponga en nationwide.
 */
export function RegionScopeField({
  regions,
  regionScope,
  regionIds,
  onScopeChange,
  onRegionIdsChange,
  hasCountry,
}: RegionScopeFieldProps) {
  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: r.id, label: r.name })),
    [regions]
  );

  const limits = regionScope ? REGION_COUNT_BY_SCOPE[regionScope] : null;
  const picksRegions = limits !== null && limits.max > 0;
  const hasRegions = regions.length > 0;

  if (!hasCountry) {
    return <Text style={accountStyles.hintText}>Pick your country first.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.scopeRow}>
        {SCOPES.map((scope, position) => {
          // Sin regiones nuestras en ese país, elegir una es imposible.
          if (scope !== ResourceRegionScope.NATIONWIDE && !hasRegions) return null;

          return (
            <ChoiceCard
              key={scope}
              index={position}
              title={REGION_SCOPE_COPY[scope].title}
              description={REGION_SCOPE_COPY[scope].description}
              selected={regionScope === scope}
              onPress={() => onScopeChange(scope)}
            />
          );
        })}
      </View>

      <Text style={accountStyles.hintText}>{REGION_SCOPE_DISCLAIMER}</Text>

      {!hasRegions ? (
        <Text style={accountStyles.hintText}>
          We have not added the regions of your country yet, so for now your profile covers all of it.
        </Text>
      ) : null}

      {picksRegions ? (
        <View style={styles.block}>
          <Text style={styles.label}>
            {limits.max === 1 ? 'Your region' : `Your regions (up to ${limits.max})`}
          </Text>
          <SelectChips
            options={regionOptions}
            selected={regionIds}
            onChange={onRegionIdsChange}
            max={limits.max}
            single={limits.max === 1}
          />
          {regionIds.length < limits.min ? (
            <Text style={accountStyles.hintText}>
              Pick {limits.min === 1 ? 'one' : `at least ${limits.min}`} to use this option.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  block: {
    gap: 10,
    marginTop: 4,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  label: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grey1,
  },
});
