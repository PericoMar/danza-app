import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER, MONO_LABEL } from '@/theme/companies';
import { AccountButton, accountStyles, webPointer } from '@/components/account';
import ResourceCard from '@/components/resources/ResourceCard';
import { ONBOARDING_COPY } from '@/constants/resourceOnboarding';
import { ONBOARDING_PREVIEW_MIN_WIDTH, ONBOARDING_PREVIEW_WIDTH } from '@/constants/layout';
import type { Country } from '@/services/countries';
import {
  Discipline,
  Region,
  Resource,
  ResourceCardData,
  ResourceField,
  ResourceOnboardingStep,
  ResourceTypeField,
} from '@/types/resource';
import {
  fieldCopy,
  fieldsOfStep,
  stepCopy,
  validateFields,
  valuesFromResource,
  type ResourceFormValues,
} from '@/utils/resourceOnboarding';
import OnboardingField from './OnboardingField';
import OnboardingProgress from './OnboardingProgress';

interface OnboardingStepProps {
  resource: Resource;
  typeFields: ResourceTypeField[];
  step: ResourceOnboardingStep;
  steps: ResourceOnboardingStep[];
  countries: Country[];
  regions: Region[];
  disciplines: Discipline[];
  saving: boolean;
  error: string | null;
  onCountryChange: (isoCode: string) => void;
  onSave: (fields: ResourceField[], values: ResourceFormValues) => Promise<boolean>;
  onSkip: (field: ResourceField) => void;
  onBack: () => void;
  onDone: () => void;
  onExit: () => void;
}

/**
 * Una pantalla del guion: su texto, sus campos y las dos salidas que hacen que
 * no sea un muro — saltar un campo opcional y salir sin perder nada.
 *
 * Los valores se leen de la ficha al entrar en la pantalla y no en cada
 * refresco: mientras se está en ella, lo que el usuario escribe manda, y al
 * continuar se guarda y la base de datos vuelve a ser la verdad.
 */
export default function OnboardingStep({
  resource,
  typeFields,
  step,
  steps,
  countries,
  regions,
  disciplines,
  saving,
  error,
  onCountryChange,
  onSave,
  onSkip,
  onBack,
  onDone,
  onExit,
}: OnboardingStepProps) {
  const { width } = useWindowDimensions();
  const fields = fieldsOfStep(typeFields, step);
  const copy = stepCopy(resource.type, step);
  const index = steps.indexOf(step);

  const [values, setValues] = useState<ResourceFormValues>(() => valuesFromResource(resource));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ResourceField, string>>>({});

  /**
   * Su tarjeta mientras escribe, con lo que lleva en la pantalla y no con lo
   * último guardado: ver aparecer su propio nombre y su foto es lo que hace que
   * esto no se parezca a rellenar un formulario.
   */
  const preview: ResourceCardData = useMemo(
    () => ({
      id: resource.id,
      slug: resource.slug,
      type: resource.type,
      verified: resource.verified,
      name: values.name.trim() || resource.name,
      logo_url: values.logo_url || null,
      description: values.description.trim() || null,
      region_scope: values.region_scope,
      regions: regions.filter((region) => values.region_ids.includes(region.id)),
    }),
    [resource, values, regions]
  );

  const asidePreview = width >= ONBOARDING_PREVIEW_MIN_WIDTH;

  useEffect(() => {
    setValues(valuesFromResource(resource));
    setFieldErrors({});
    // Solo al entrar en una pantalla (o al cambiar de ficha), no en cada guardado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.id, step]);

  const patch = (next: Partial<ResourceFormValues>) => {
    setValues((current) => ({ ...current, ...next }));
    // Al tocar algo, el aviso anterior deja de ser cierto.
    setFieldErrors({});
  };

  const handleCountryChange = (isoCode: string) => {
    // El país se guarda al momento porque de él dependen las regiones; el
    // alcance elegido antes deja de valer.
    patch({ country_iso_code: isoCode, region_scope: null, region_ids: [] });
    onCountryChange(isoCode);
  };

  const handleContinue = async () => {
    // Lo que la base de datos rechazaría, dicho aquí y junto a su campo: nadie
    // debería leer nunca el nombre de un CHECK.
    const invalid = validateFields(fields, values);
    if (Object.keys(invalid).length > 0) {
      setFieldErrors(invalid);
      return;
    }

    const saved = await onSave(
      fields.map((f) => f.field),
      values
    );
    if (saved) onDone();
  };

  const previewBlock = (
    <View style={[styles.preview, asidePreview && { width: ONBOARDING_PREVIEW_WIDTH }]}>
      <Text style={styles.previewLabel}>How dancers will see you</Text>
      <ResourceCard resource={preview} />
    </View>
  );

  return (
    <View style={styles.wrap}>
      <OnboardingProgress
        current={index + 1}
        total={steps.length}
        completeness={resource.completeness_pct}
      />

      <View style={styles.head}>
        <Text style={styles.title}>{copy.title}</Text>
        {copy.subtitle ? <Text style={accountStyles.bodyText}>{copy.subtitle}</Text> : null}
      </View>

      {asidePreview ? null : previewBlock}

      <View style={[styles.body, asidePreview && styles.bodyWide]}>
        <View style={styles.column}>
          <View style={styles.fields}>
            {fields.map((field, position) => {
              const skipped = resource.skipped_fields.includes(field.field);
              const canSkip = !field.is_required;

              return (
                <View
                  key={field.field}
                  // Los campos se apilan en orden descendente para que la lista
                  // de un desplegable (el país) caiga por encima de los campos
                  // que vienen debajo y no al revés: hermanos sin zIndex se
                  // pintan en orden, y el último gana.
                  style={[styles.field, { zIndex: fields.length - position }]}
                >
                  <OnboardingField
                    resourceId={resource.id}
                    type={resource.type}
                    field={field}
                    values={values}
                    onPatch={patch}
                    error={fieldErrors[field.field]}
                    onCountryChange={handleCountryChange}
                    countries={countries}
                    regions={regions}
                    disciplines={disciplines}
                  />

                  {canSkip && !skipped ? (
                    <Pressable
                      onPress={() => onSkip(field.field)}
                      accessibilityRole="button"
                      accessibilityLabel={`${ONBOARDING_COPY.skip}: ${fieldCopy(resource.type, field.field).label}`}
                      style={[styles.skip, webPointer]}
                    >
                      <Text style={styles.skipLabel}>{ONBOARDING_COPY.skip}</Text>
                    </Pressable>
                  ) : null}

                  {skipped ? <Text style={accountStyles.hintText}>Left for later.</Text> : null}
                </View>
              );
            })}
          </View>

          {error ? <Text style={accountStyles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            {index > 0 ? (
              <AccountButton label="Back" variant="ghost" onPress={onBack} />
            ) : null}
            <AccountButton
              label={index === steps.length - 1 ? 'Review' : 'Continue'}
              onPress={handleContinue}
              loading={saving}
            />
          </View>

          <Pressable
            onPress={onExit}
            accessibilityRole="button"
            style={[styles.exit, webPointer]}
          >
            <Text style={styles.exitLabel}>{ONBOARDING_COPY.saveAndExit}</Text>
          </Pressable>
        </View>

        {asidePreview ? previewBlock : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 26,
  },
  head: {
    gap: 8,
  },
  body: {
    gap: 26,
  },
  bodyWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 40,
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: 26,
    // Por encima de la tarjeta de al lado, que va después en el árbol: si no,
    // la lista del desplegable pasaría por debajo de ella.
    zIndex: 1,
  },
  preview: {
    gap: 8,
  },
  previewLabel: {
    fontFamily: MONO_LABEL,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: Colors.text,
  },
  fields: {
    gap: 26,
  },
  field: {
    gap: 8,
  },
  skip: {
    alignSelf: 'flex-start',
  },
  skipLabel: {
    fontFamily: INTER,
    fontSize: 12.5,
    fontWeight: '500',
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  exit: {
    alignSelf: 'flex-start',
  },
  exitLabel: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
