import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import { AccountCheckbox, AccountTextField, accountStyles } from '@/components/account';
import SelectChips from '@/components/resources/SelectChips';
import CountryField from '@/components/resources/CountryField';
import { RegionScopeField } from './RegionField';
import EmailsField from './EmailsField';
import { GalleryField, LogoField } from './ImageFields';
import {
  PHOTOGRAPHY_WORK_TYPE_COPY,
  STUDENT_GOAL_COPY,
} from '@/constants/resourceOnboarding';
import {
  RESOURCE_ADDRESS_MAX_CHARS,
  RESOURCE_DESCRIPTION_MAX_CHARS,
  RESOURCE_FOUNDER_NAME_MAX_CHARS,
  RESOURCE_LONG_TEXT_MAX_CHARS,
  RESOURCE_NAME_MAX_CHARS,
} from '@/constants/resources';
import type { Country } from '@/services/countries';
import {
  Discipline,
  Region,
  ResourceField,
  ResourcePhotographyWorkType,
  ResourceStudentGoal,
  ResourceType,
  ResourceTypeField,
} from '@/types/resource';
import { fieldCopy, type ResourceFormValues } from '@/utils/resourceOnboarding';

interface OnboardingFieldProps {
  resourceId: string;
  type: ResourceType;
  field: ResourceTypeField;
  values: ResourceFormValues;
  onPatch: (patch: Partial<ResourceFormValues>) => void;
  /** Lo que este campo tiene mal, ya en cristiano. */
  error?: string;
  /** El país se guarda al instante porque de él dependen las regiones. */
  onCountryChange: (isoCode: string) => void;
  countries: Country[];
  regions: Region[];
  disciplines: Discipline[];
}

const GOAL_OPTIONS = Object.values(ResourceStudentGoal).map((value) => ({
  value,
  label: STUDENT_GOAL_COPY[value].title,
}));

const WORK_TYPE_OPTIONS = Object.values(ResourcePhotographyWorkType).map((value) => ({
  value,
  label: PHOTOGRAPHY_WORK_TYPE_COPY[value].title,
}));

/**
 * El input de un campo del guion. Es el único `switch` por campo de la UI, el
 * espejo del `case` de `resource_field_state()` en la base de datos: añadir un
 * valor a `resource_field` obliga a pasar por aquí y por allí, y por ningún
 * otro sitio.
 */
export default function OnboardingField({
  resourceId,
  type,
  field,
  values,
  onPatch,
  error,
  onCountryChange,
  countries,
  regions,
  disciplines,
}: OnboardingFieldProps) {
  const copy = fieldCopy(type, field.field);
  const text = (
    key: Extract<
      keyof ResourceFormValues,
      | 'name'
      | 'founded_year'
      | 'founder_name'
      | 'address'
      | 'website_url'
      | 'instagram_url'
      | 'facebook_url'
      | 'professional_experience'
      | 'teaching_method'
      | 'specialization'
      | 'relation_to_dance'
      | 'class_style'
      | 'description'
    >,
    options: { multiline?: boolean; maxLength?: number; keyboard?: 'url' | 'numeric' } = {}
  ) => (
    <AccountTextField
      label={copy.label}
      value={values[key]}
      onChangeText={(value) => onPatch({ [key]: value } as Partial<ResourceFormValues>)}
      placeholder={copy.placeholder}
      hint={copy.help}
      error={error}
      multiline={options.multiline}
      inputProps={{
        maxLength: options.maxLength,
        ...(options.keyboard === 'url'
          ? { autoCapitalize: 'none' as const, keyboardType: 'url' as const }
          : {}),
        ...(options.keyboard === 'numeric' ? { keyboardType: 'number-pad' as const } : {}),
      }}
    />
  );

  switch (field.field) {
    case ResourceField.NAME:
      return text('name', { maxLength: RESOURCE_NAME_MAX_CHARS });

    case ResourceField.FOUNDED_YEAR:
      return text('founded_year', { maxLength: 4, keyboard: 'numeric' });

    case ResourceField.FOUNDER_NAME:
      return text('founder_name', { maxLength: RESOURCE_FOUNDER_NAME_MAX_CHARS });

    case ResourceField.COUNTRY:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <CountryField
            countries={countries}
            value={values.country_iso_code}
            onChange={onCountryChange}
          />
        </Labelled>
      );

    case ResourceField.REGION:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <RegionScopeField
            regions={regions}
            regionScope={values.region_scope}
            regionIds={values.region_ids}
            hasCountry={values.country_iso_code !== ''}
            onScopeChange={(scope) =>
              onPatch({
                region_scope: scope,
                // Cambiar de alcance invalida lo elegido antes: 3 regiones no
                // caben en "una sola", y nationwide no admite ninguna.
                region_ids: [],
              })
            }
            onRegionIdsChange={(ids) => onPatch({ region_ids: ids })}
          />
        </Labelled>
      );

    case ResourceField.ADDRESS:
      return (
        <View style={styles.stack}>
          {values.no_fixed_address ? null : text('address', { maxLength: RESOURCE_ADDRESS_MAX_CHARS })}
          <AccountCheckbox
            checked={values.no_fixed_address}
            onToggle={() =>
              onPatch({
                no_fixed_address: !values.no_fixed_address,
                ...(values.no_fixed_address ? {} : { address: '' }),
              })
            }
            label="I have no fixed address"
          />
        </View>
      );

    case ResourceField.EMAILS:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <EmailsField
            emails={values.emails}
            onChange={(emails) => onPatch({ emails })}
            placeholder={copy.placeholder}
          />
        </Labelled>
      );

    case ResourceField.WEBSITE_URL:
      return text('website_url', { keyboard: 'url' });

    case ResourceField.INSTAGRAM_URL:
      return text('instagram_url', { keyboard: 'url' });

    case ResourceField.FACEBOOK_URL:
      return text('facebook_url', { keyboard: 'url' });

    case ResourceField.PROFESSIONAL_EXPERIENCE:
      return text('professional_experience', {
        multiline: true,
        maxLength: RESOURCE_LONG_TEXT_MAX_CHARS,
      });

    case ResourceField.TEACHING_METHOD:
      return text('teaching_method', { multiline: true, maxLength: RESOURCE_LONG_TEXT_MAX_CHARS });

    case ResourceField.SPECIALIZATION:
      return text('specialization', { multiline: true, maxLength: RESOURCE_LONG_TEXT_MAX_CHARS });

    case ResourceField.RELATION_TO_DANCE:
      return text('relation_to_dance', { multiline: true, maxLength: RESOURCE_LONG_TEXT_MAX_CHARS });

    case ResourceField.CLASS_STYLE:
      return text('class_style', { multiline: true, maxLength: RESOURCE_LONG_TEXT_MAX_CHARS });

    case ResourceField.DESCRIPTION:
      return text('description', { multiline: true, maxLength: RESOURCE_DESCRIPTION_MAX_CHARS });

    case ResourceField.DISCIPLINES:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <SelectChips
            options={disciplines.map((d) => ({ value: d.id, label: d.name }))}
            selected={values.discipline_ids}
            onChange={(ids) => onPatch({ discipline_ids: ids })}
          />
        </Labelled>
      );

    case ResourceField.STUDENT_GOALS:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <SelectChips
            options={GOAL_OPTIONS}
            selected={values.student_goals}
            onChange={(student_goals) => onPatch({ student_goals })}
          />
        </Labelled>
      );

    case ResourceField.PHOTOGRAPHY_WORK_TYPES:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <SelectChips
            options={WORK_TYPE_OPTIONS}
            selected={values.photography_work_types}
            onChange={(photography_work_types) => onPatch({ photography_work_types })}
          />
        </Labelled>
      );

    case ResourceField.LOGO:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <LogoField
            resourceId={resourceId}
            logoUrl={values.logo_url}
            onChange={(logo_url) => onPatch({ logo_url })}
          />
        </Labelled>
      );

    case ResourceField.IMAGES:
      return (
        <Labelled label={copy.label} help={copy.help} error={error}>
          <GalleryField
            resourceId={resourceId}
            images={values.images}
            onChange={(images) => onPatch({ images })}
            minCount={field.min_count}
          />
        </Labelled>
      );
  }
}

/** Etiqueta + ayuda alrededor de un control que no es un input de texto. */
function Labelled({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stack}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={accountStyles.errorText}>{error}</Text>
      ) : help ? (
        <Text style={accountStyles.hintText}>{help}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  label: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grey1,
  },
});
