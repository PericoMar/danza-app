// types/resource.ts
// El directorio de servicios, profesionales y escuelas de ballet
// (docs/adr/0002-resources-directory.md).
//
// Una cuenta es un resource: `users` guarda quién entra, `resources` guarda
// todo el perfil. Nada se duplica entre los dos.

/** Para qué se registró una cuenta (enum `account_type`). */
export const AccountType = {
  DANCER: "dancer",
  PROFESSIONAL: "professional",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

/** Tipo de recurso (enum `resource_type`). */
export const ResourceType = {
  DANCE_SCHOOL: "dance_school",
  FREELANCE_TEACHER: "freelance_teacher",
  PHOTOGRAPHER: "photographer",
  PHYSIOTHERAPIST: "physiotherapist",
  MOVEMENT_STUDIO: "movement_studio",
  PERSONAL_TRAINER: "personal_trainer",
  NUTRITIONIST: "nutritionist",
  GENERAL_WELLBEING: "general_wellbeing",
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

/**
 * Ciclo de vida de una ficha (enum `resource_status`). El dueño llega hasta
 * `pending_review`; solo un admin pone `published` (lo fuerza `resources_guard`).
 */
export const ResourceStatus = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  PUBLISHED: "published",
  HIDDEN: "hidden",
} as const;

export type ResourceStatus = (typeof ResourceStatus)[keyof typeof ResourceStatus];

/**
 * Alcance geográfico (enum `resource_region_scope`). El orden es el de
 * preferencia en el listado: `fixed` manda sobre `multiple` y este sobre
 * `nationwide` (ver `placement_rank`).
 */
export const ResourceRegionScope = {
  FIXED: "fixed",
  MULTIPLE: "multiple",
  NATIONWIDE: "nationwide",
} as const;

export type ResourceRegionScope = (typeof ResourceRegionScope)[keyof typeof ResourceRegionScope];

/** Cuántas regiones admite cada alcance (lo valida `assert_resource_region_scope`). */
export const REGION_COUNT_BY_SCOPE: Record<ResourceRegionScope, { min: number; max: number }> = {
  [ResourceRegionScope.FIXED]: { min: 1, max: 1 },
  [ResourceRegionScope.MULTIPLE]: { min: 2, max: 3 },
  [ResourceRegionScope.NATIONWIDE]: { min: 0, max: 0 },
};

/** Puesto en el listado que da cada alcance; menor sale antes (vista `placement_rank`). */
export const PLACEMENT_RANK_BY_SCOPE: Record<ResourceRegionScope, number> = {
  [ResourceRegionScope.FIXED]: 0,
  [ResourceRegionScope.MULTIPLE]: 1,
  [ResourceRegionScope.NATIONWIDE]: 2,
};

/** Objetivos del alumno (enum `resource_student_goal`). */
export const ResourceStudentGoal = {
  RECREATIONAL: "recreational",
  VOCATIONAL: "vocational",
  PROFESSIONAL: "professional",
} as const;

export type ResourceStudentGoal = (typeof ResourceStudentGoal)[keyof typeof ResourceStudentGoal];

/** Tipos de trabajo de un fotógrafo (enum `resource_photography_work_type`). */
export const ResourcePhotographyWorkType = {
  INDOOR_STUDIO: "indoor_studio",
  OUTDOOR_URBAN: "outdoor_urban",
  DANCE_SCHOOL_LOCATION: "dance_school_location",
  LIVE_THEATER: "live_theater",
} as const;

export type ResourcePhotographyWorkType =
  (typeof ResourcePhotographyWorkType)[keyof typeof ResourcePhotographyWorkType];

/**
 * Cada cosa que el onboarding puede preguntar (enum `resource_field`). No
 * siempre es una columna: `region` es `region_scope` + sus regiones, `emails`
 * es una tabla hija y `logo` es `logo_url`.
 */
export const ResourceField = {
  NAME: "name",
  FOUNDED_YEAR: "founded_year",
  FOUNDER_NAME: "founder_name",
  COUNTRY: "country",
  REGION: "region",
  ADDRESS: "address",
  EMAILS: "emails",
  WEBSITE_URL: "website_url",
  INSTAGRAM_URL: "instagram_url",
  FACEBOOK_URL: "facebook_url",
  PROFESSIONAL_EXPERIENCE: "professional_experience",
  DISCIPLINES: "disciplines",
  TEACHING_METHOD: "teaching_method",
  STUDENT_GOALS: "student_goals",
  SPECIALIZATION: "specialization",
  RELATION_TO_DANCE: "relation_to_dance",
  CLASS_STYLE: "class_style",
  PHOTOGRAPHY_WORK_TYPES: "photography_work_types",
  LOGO: "logo",
  DESCRIPTION: "description",
  IMAGES: "images",
} as const;

export type ResourceField = (typeof ResourceField)[keyof typeof ResourceField];

/**
 * Las pantallas del onboarding, en orden (enum `resource_onboarding_step`).
 * El selector de tipo no está: va antes de que exista la fila.
 */
export const ResourceOnboardingStep = {
  BASICS: "basics",
  REACH: "reach",
  CONTACT: "contact",
  CRAFT: "craft",
  SHOWCASE: "showcase",
} as const;

export type ResourceOnboardingStep =
  (typeof ResourceOnboardingStep)[keyof typeof ResourceOnboardingStep];

/** Orden de las pantallas, el mismo que el del enum en la BD. */
export const RESOURCE_ONBOARDING_STEPS = [
  ResourceOnboardingStep.BASICS,
  ResourceOnboardingStep.REACH,
  ResourceOnboardingStep.CONTACT,
  ResourceOnboardingStep.CRAFT,
  ResourceOnboardingStep.SHOWCASE,
] as const;

// ---------------------------------------------------------------------------
// Catálogos que mantenemos nosotros
// ---------------------------------------------------------------------------

/** Una región de un país (tabla `regions`). */
export type Region = {
  id: string;
  country_iso_code: string;
  name: string;
  slug: string;
  position: number;
};

/** Una disciplina (tabla `disciplines`). */
export type Discipline = {
  id: string;
  name: string;
  slug: string;
  position: number;
};

/**
 * Qué se le pregunta a cada tipo, dónde y qué necesita para publicarse
 * (tabla `resource_type_fields`). El formulario se dibuja con esto.
 */
export type ResourceTypeField = {
  type: ResourceType;
  field: ResourceField;
  step: ResourceOnboardingStep;
  position: number;
  is_required: boolean;
  min_count: number | null;
};

// ---------------------------------------------------------------------------
// Hijas, tal como las embebe `resources_enriched`
// ---------------------------------------------------------------------------

/** Región elegida por una ficha, en el orden que fijó su dueño. */
export type ResourceRegionRef = {
  id: string;
  name: string;
  slug: string;
  country_iso_code: string;
};

/** Email de contacto. El primero es el de preferencia; `label` dice para qué es. */
export type ResourceEmail = {
  id: string;
  email: string;
  label: string | null;
};

/** Imagen de la galería. El logo es `logo_url`, no la primera de aquí. */
export type ResourceImage = {
  id: string;
  image_url: string;
  caption: string | null;
};

/** Disciplina embebida en una ficha (sin `position`). */
export type ResourceDisciplineRef = {
  id: string;
  name: string;
  slug: string;
};

// ---------------------------------------------------------------------------
// La ficha
// ---------------------------------------------------------------------------

/** Una fila de `resources_enriched`. */
export type Resource = {
  id: string;
  user_id: string | null; // null => la sembramos nosotros, sin cuenta detrás
  type: ResourceType;
  status: ResourceStatus;
  name: string;
  slug: string;

  country_iso_code: string | null;
  country_name: string | null;
  region_scope: ResourceRegionScope | null; // null => aún no lo ha elegido
  address: string | null;
  no_fixed_address: boolean; // true => no tiene dirección a propósito

  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  logo_url: string | null;
  description: string | null;
  verified: boolean;

  // Campos custom compartidos; qué tipo usa cada uno lo dice `resource_type_fields`.
  founded_year: number | null;
  founder_name: string | null;
  professional_experience: string | null;
  teaching_method: string | null;
  specialization: string | null;
  relation_to_dance: string | null;
  class_style: string | null;

  published_at: string | null;
  created_at: string;
  updated_at: string;

  regions: ResourceRegionRef[];
  emails: ResourceEmail[];
  images: ResourceImage[];
  disciplines: ResourceDisciplineRef[];
  student_goals: ResourceStudentGoal[];
  photography_work_types: ResourcePhotographyWorkType[];

  // Derivados en la vista.
  placement_rank: number | null; // 0 fixed, 1 multiple, 2 nationwide
  missing_fields: ResourceField[]; // obligatorios que faltan para publicar
  skipped_fields: ResourceField[]; // los que su dueño dejó para luego
  completeness_pct: number;
  next_field: ResourceField | null; // por dónde sigue el onboarding; null => nada que preguntar
  next_step: ResourceOnboardingStep | null;
};

/** Slice mínimo para una tarjeta del listado. */
export type ResourceCardData = Pick<
  Resource,
  "id" | "slug" | "type" | "name" | "logo_url" | "description" | "verified" | "regions" | "region_scope"
>;

/**
 * Payload de la RPC `save_resource`. Una clave ausente deja lo guardado como
 * está; presente, lo reemplaza (y en las listas el orden del array manda). Es
 * lo que permite al onboarding guardar paso a paso sin borrar el resto.
 */
export type SaveResourcePayload = {
  id: string | null; // null => alta (necesita `type` y `name`)
  user_id?: string | null; // solo admins: sembrar una ficha sin cuenta
  type?: ResourceType; // solo cambia mientras es borrador
  status?: ResourceStatus; // el cliente nunca llega a `published`
  name?: string;
  country_iso_code?: string | null;
  region_scope?: ResourceRegionScope | null;
  address?: string | null;
  no_fixed_address?: boolean; // true => fuerza `address` a null
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  founded_year?: number | null;
  founder_name?: string | null;
  professional_experience?: string | null;
  teaching_method?: string | null;
  specialization?: string | null;
  relation_to_dance?: string | null;
  class_style?: string | null;

  // Mudar la ficha de un país a otro sin mandar `region_ids` borra sus regiones
  // y su alcance: una región pertenece a un país, así que mudarse las invalida
  // y el onboarding las vuelve a preguntar. Poner el país por primera vez no
  // es una mudanza y no borra nada.
  region_ids?: string[];
  emails?: Omit<ResourceEmail, "id">[];
  images?: Omit<ResourceImage, "id">[];
  discipline_ids?: string[];
  student_goals?: ResourceStudentGoal[];
  photography_work_types?: ResourcePhotographyWorkType[];
  skipped_fields?: ResourceField[];
};

/**
 * Una fila de `resource_region_placements`: ficha publicada que debe aparecer
 * en esa región, con su puesto. Las `nationwide` tienen una fila por cada
 * región de su país.
 */
export type ResourceRegionPlacement = {
  region_id: string;
  resource_id: string;
  country_iso_code: string;
  placement_rank: number;
};
