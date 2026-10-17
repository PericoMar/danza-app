// utils/resourceOnboarding.ts
// La lógica del onboarding que no es ni pintar ni hablar con Supabase.
//
// El guion lo manda la base de datos: `resource_type_fields` dice qué campos
// tiene cada tipo, en qué pantalla y en qué orden, y la vista dice por dónde
// sigue (`next_field`). Aquí solo se agrupa eso y se traduce entre el estado
// del formulario y el payload de `save_resource`.

import {
  FIELD_COPY,
  FIELD_COPY_BY_TYPE,
  STEP_COPY,
  STEP_COPY_BY_TYPE,
} from '@/constants/resourceOnboarding';
import {
  RESOURCE_FOUNDED_YEAR_MIN,
  RESOURCE_URL_PATTERN,
  resourceFoundedYearMax,
} from '@/constants/resources';
import { isValidEmail } from '@/utils/validation';
import {
  REGION_COUNT_BY_SCOPE,
  RESOURCE_ONBOARDING_STEPS,
  Resource,
  ResourceField,
  ResourceOnboardingStep,
  ResourcePhotographyWorkType,
  ResourceRegionScope,
  ResourceStudentGoal,
  ResourceType,
  ResourceTypeField,
  SaveResourcePayload,
} from '@/types/resource';

// ---------------------------------------------------------------------------
// Textos: base + lo que cambia por tipo
// ---------------------------------------------------------------------------

export function stepCopy(type: ResourceType, step: ResourceOnboardingStep) {
  return { ...STEP_COPY[step], ...STEP_COPY_BY_TYPE[type]?.[step] };
}

export function fieldCopy(type: ResourceType, field: ResourceField) {
  return { ...FIELD_COPY[field], ...FIELD_COPY_BY_TYPE[type]?.[field] };
}

// ---------------------------------------------------------------------------
// El guion
// ---------------------------------------------------------------------------

/** Las pantallas que tiene este tipo, en el orden del flujo. */
export function stepsOf(typeFields: ResourceTypeField[]): ResourceOnboardingStep[] {
  const present = new Set(typeFields.map((f) => f.step));
  return RESOURCE_ONBOARDING_STEPS.filter((step) => present.has(step));
}

/** Los campos de una pantalla, en el orden en que se preguntan. */
export function fieldsOfStep(
  typeFields: ResourceTypeField[],
  step: ResourceOnboardingStep
): ResourceTypeField[] {
  return typeFields.filter((f) => f.step === step).sort((a, b) => a.position - b.position);
}

export function stepOfField(
  typeFields: ResourceTypeField[],
  field: ResourceField | null
): ResourceOnboardingStep | null {
  if (!field) return null;
  return typeFields.find((f) => f.field === field)?.step ?? null;
}

/**
 * Por dónde entrar al onboarding: la pantalla del primer campo que no está ni
 * contestado ni saltado. Lo calcula la vista (`next_step`); si ya no queda
 * nada, se va a la última para que la repase.
 */
export function resumeStep(
  resource: Resource,
  typeFields: ResourceTypeField[]
): ResourceOnboardingStep {
  const steps = stepsOf(typeFields);
  return resource.next_step ?? steps[steps.length - 1];
}

// ---------------------------------------------------------------------------
// Estado del formulario
// ---------------------------------------------------------------------------

export type ResourceEmailDraft = { email: string; label: string };
export type ResourceImageDraft = { image_url: string; caption: string };

/** Todo lo editable de una ficha, en el formato que usan los inputs (texto). */
export type ResourceFormValues = {
  name: string;
  founded_year: string;
  founder_name: string;
  country_iso_code: string;
  region_scope: ResourceRegionScope | null;
  region_ids: string[];
  address: string;
  no_fixed_address: boolean;
  emails: ResourceEmailDraft[];
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  professional_experience: string;
  discipline_ids: string[];
  teaching_method: string;
  student_goals: ResourceStudentGoal[];
  specialization: string;
  relation_to_dance: string;
  class_style: string;
  photography_work_types: ResourcePhotographyWorkType[];
  logo_url: string;
  description: string;
  images: ResourceImageDraft[];
};

export function emptyResourceEmail(): ResourceEmailDraft {
  return { email: '', label: '' };
}

/** Lo guardado, listo para editar. Una ficha nueva llega con todo vacío. */
export function valuesFromResource(resource: Resource | null): ResourceFormValues {
  return {
    name: resource?.name ?? '',
    founded_year: resource?.founded_year ? String(resource.founded_year) : '',
    founder_name: resource?.founder_name ?? '',
    country_iso_code: resource?.country_iso_code ?? '',
    region_scope: resource?.region_scope ?? null,
    region_ids: (resource?.regions ?? []).map((r) => r.id),
    address: resource?.address ?? '',
    no_fixed_address: resource?.no_fixed_address ?? false,
    emails: (resource?.emails ?? []).map((e) => ({ email: e.email, label: e.label ?? '' })),
    website_url: resource?.website_url ?? '',
    instagram_url: resource?.instagram_url ?? '',
    facebook_url: resource?.facebook_url ?? '',
    professional_experience: resource?.professional_experience ?? '',
    discipline_ids: (resource?.disciplines ?? []).map((d) => d.id),
    teaching_method: resource?.teaching_method ?? '',
    student_goals: resource?.student_goals ?? [],
    specialization: resource?.specialization ?? '',
    relation_to_dance: resource?.relation_to_dance ?? '',
    class_style: resource?.class_style ?? '',
    photography_work_types: resource?.photography_work_types ?? [],
    logo_url: resource?.logo_url ?? '',
    description: resource?.description ?? '',
    images: (resource?.images ?? []).map((i) => ({
      image_url: i.image_url,
      caption: i.caption ?? '',
    })),
  };
}

const orNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Nadie escribe "https://" al teclear su web. Si falta el esquema se lo
 * ponemos: el CHECK de la base de datos lo exige, y rechazar a alguien por eso
 * sería la baja más tonta del onboarding.
 */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const urlOrNull = (value: string) => orNull(normalizeUrl(value));

/**
 * El payload de solo los campos de una pantalla. Lo que no está en el payload
 * no se toca en la base de datos, que es lo que permite guardar paso a paso.
 *
 * Es el espejo en el cliente del `case` de `resource_field_state()`: un campo
 * del enum no siempre es una columna (`region` son dos cosas, `logo` es
 * `logo_url`, `emails` es una tabla hija).
 */
export function payloadForFields(
  fields: ResourceField[],
  values: ResourceFormValues
): Partial<SaveResourcePayload> {
  const payload: Partial<SaveResourcePayload> = {};

  for (const field of fields) {
    switch (field) {
      case ResourceField.NAME:
        payload.name = values.name.trim();
        break;
      case ResourceField.FOUNDED_YEAR: {
        const year = Number.parseInt(values.founded_year, 10);
        payload.founded_year = Number.isFinite(year) ? year : null;
        break;
      }
      case ResourceField.FOUNDER_NAME:
        payload.founder_name = orNull(values.founder_name);
        break;
      case ResourceField.COUNTRY:
        payload.country_iso_code = orNull(values.country_iso_code);
        break;
      case ResourceField.REGION:
        payload.region_scope = values.region_scope;
        payload.region_ids = values.region_ids;
        break;
      case ResourceField.ADDRESS:
        payload.no_fixed_address = values.no_fixed_address;
        payload.address = values.no_fixed_address ? null : orNull(values.address);
        break;
      case ResourceField.EMAILS:
        payload.emails = values.emails
          .filter((e) => e.email.trim() !== '')
          .map((e) => ({ email: e.email.trim(), label: orNull(e.label) }));
        break;
      case ResourceField.WEBSITE_URL:
        payload.website_url = urlOrNull(values.website_url);
        break;
      case ResourceField.INSTAGRAM_URL:
        payload.instagram_url = urlOrNull(values.instagram_url);
        break;
      case ResourceField.FACEBOOK_URL:
        payload.facebook_url = urlOrNull(values.facebook_url);
        break;
      case ResourceField.PROFESSIONAL_EXPERIENCE:
        payload.professional_experience = orNull(values.professional_experience);
        break;
      case ResourceField.DISCIPLINES:
        payload.discipline_ids = values.discipline_ids;
        break;
      case ResourceField.TEACHING_METHOD:
        payload.teaching_method = orNull(values.teaching_method);
        break;
      case ResourceField.STUDENT_GOALS:
        payload.student_goals = values.student_goals;
        break;
      case ResourceField.SPECIALIZATION:
        payload.specialization = orNull(values.specialization);
        break;
      case ResourceField.RELATION_TO_DANCE:
        payload.relation_to_dance = orNull(values.relation_to_dance);
        break;
      case ResourceField.CLASS_STYLE:
        payload.class_style = orNull(values.class_style);
        break;
      case ResourceField.PHOTOGRAPHY_WORK_TYPES:
        payload.photography_work_types = values.photography_work_types;
        break;
      case ResourceField.LOGO:
        payload.logo_url = orNull(values.logo_url);
        break;
      case ResourceField.DESCRIPTION:
        payload.description = orNull(values.description);
        break;
      case ResourceField.IMAGES:
        payload.images = values.images
          .filter((i) => i.image_url.trim() !== '')
          .map((i) => ({ image_url: i.image_url.trim(), caption: orNull(i.caption) }));
        break;
    }
  }

  return payload;
}

/**
 * Lo que la base de datos va a rechazar, dicho antes y junto a su campo.
 *
 * No comprueba obligatoriedad: en un borrador no hay nada obligatorio, eso solo
 * se exige al publicar y lo decide la base de datos. Aquí solo se mira que lo
 * escrito tenga forma válida, para que nadie llegue a ver el nombre de un CHECK
 * (ver `utils/resourceErrors`).
 */
export function validateFields(
  fields: ResourceTypeField[],
  values: ResourceFormValues
): Partial<Record<ResourceField, string>> {
  const errors: Partial<Record<ResourceField, string>> = {};

  for (const { field } of fields) {
    switch (field) {
      case ResourceField.WEBSITE_URL:
      case ResourceField.INSTAGRAM_URL:
      case ResourceField.FACEBOOK_URL: {
        const value = normalizeUrl(values[field]);
        if (value !== '' && !RESOURCE_URL_PATTERN.test(value)) {
          errors[field] = 'That does not look like a web address.';
        }
        break;
      }

      case ResourceField.EMAILS: {
        const written = values.emails.map((e) => e.email.trim()).filter((e) => e !== '');
        if (written.some((email) => !isValidEmail(email))) {
          errors[field] = 'That email address does not look right.';
        } else if (new Set(written.map((e) => e.toLowerCase())).size !== written.length) {
          errors[field] = 'That email is repeated.';
        }
        break;
      }

      case ResourceField.FOUNDED_YEAR: {
        const written = values.founded_year.trim();
        if (written !== '') {
          const year = Number(written);
          const max = resourceFoundedYearMax();
          if (!Number.isInteger(year) || year < RESOURCE_FOUNDED_YEAR_MIN || year > max) {
            errors[field] = `Use a year between ${RESOURCE_FOUNDED_YEAR_MIN} and ${max}.`;
          }
        }
        break;
      }

      case ResourceField.REGION: {
        const scope = values.region_scope;
        if (scope) {
          const { min, max } = REGION_COUNT_BY_SCOPE[scope];
          const picked = values.region_ids.length;
          if (picked < min || picked > max) {
            errors[field] =
              max === 0
                ? 'A nationwide profile covers its whole country, so it takes no regions.'
                : min === max
                  ? `Pick ${min === 1 ? 'one region' : `${min} regions`}.`
                  : `Pick between ${min} and ${max} regions.`;
          }
        }
        break;
      }
    }
  }

  return errors;
}

/** Cuántos campos obligatorios faltan, para el texto de "listo para enviar". */
export function missingCount(resource: Resource | null): number {
  return resource?.missing_fields.length ?? 0;
}
