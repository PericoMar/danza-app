// Calendario de audiciones: valores que comparten el formulario, la vista y la BD.

// Textos de los atajos del formulario. Son labels normales (se guardan en
// `date_label`), no modos: la fecha real o estimada sigue existiendo debajo.
export const DATE_LABEL_PRESETS = {
  ASAP: 'ASAP',
  TO_BE_ARRANGED: 'To be arranged upon invitation',
} as const;

// Un rango de audición dura como mucho 60 días (CHECK audition_dates_max_60_days).
export const AUDITION_DATE_MAX_DAYS = 60;

// Lugar de una fecha online cuando no se indica otro (lo pone también el trigger).
export const ONLINE_PLACE = 'Online';

// Códigos de `countries`: ISO 3166-1 alpha-2 o nación del Reino Unido (GB-ENG…).
export const COUNTRY_ISO_CODE_PATTERN = /^[A-Z]{2}(-[A-Z]{3})?$/;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
