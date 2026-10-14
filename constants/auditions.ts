// Calendario de audiciones: valores que comparten el formulario, la vista y la BD.

// Textos de los atajos del formulario. Son labels normales (se guardan en
// `date_label`), no modos: la fecha real o estimada sigue existiendo debajo.
export const DATE_LABEL_PRESETS = {
  ASAP: 'ASAP',
  ALWAYS_OPEN: 'Always open',
  TO_BE_ARRANGED: 'To be arranged upon invitation',
} as const;

// Atajos de deadline sin fecha real: se apuntan hasta que empieza su primera audición.
export const OPEN_DEADLINE_LABELS = [DATE_LABEL_PRESETS.ASAP, DATE_LABEL_PRESETS.ALWAYS_OPEN] as const;

export type OpenDeadlineLabel = (typeof OPEN_DEADLINE_LABELS)[number];

// La tira de fechas de la card del listado solo tiene sitio para labels cortos;
// uno más largo se lee como "TBA". La ficha de la audición lo muestra entero.
export const CARD_LABEL_MAX_CHARS = 12;
export const CARD_LABEL_FALLBACK = 'TBA';
// Lo que muestra la card en vez de la fecha cuando hay varias fechas de audición.
export const CARD_MULTIPLE_DATES = 'Multiple';

// Un rango de audición dura como mucho 60 días (CHECK audition_dates_max_60_days).
export const AUDITION_DATE_MAX_DAYS = 60;

// Lugar de una fecha online cuando no se indica otro (lo pone también el trigger).
export const ONLINE_PLACE = 'Online';

// Códigos de `countries`: ISO 3166-1 alpha-2 o nación del Reino Unido (GB-ENG…).
export const COUNTRY_ISO_CODE_PATTERN = /^[A-Z]{2}(-[A-Z]{3})?$/;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Enlaces de inscripción (`audition_application_links`).
// Mismo patrón que el CHECK audition_application_links_url_http.
export const APPLICATION_LINK_URL_PATTERN = /^https?:\/\/\S+$/i;
// CHECK audition_application_links_label_length.
export const APPLICATION_LINK_LABEL_MAX_CHARS = 60;
// Solo en la app: la BD no limita la URL.
export const APPLICATION_LINK_URL_MAX_CHARS = 500;
// Texto del botón de un enlace sin label cuando es el único; con varios se
// usa el dominio de cada uno, para distinguirlos.
export const APPLICATION_LINK_DEFAULT_LABEL = 'Apply';
// Atajos del formulario: rellenan el label, que se puede seguir editando.
export const APPLICATION_LINK_LABEL_PRESETS = ['Apply online', 'Upload your video', 'Register'] as const;

// Emails de contacto (`audition_emails`). La dirección se valida con
// isValidEmail (utils/validation), la misma regla que el CHECK audition_emails_email_format.
// CHECK audition_emails_label_length.
export const AUDITION_EMAIL_LABEL_MAX_CHARS = 60;
// Solo en la app: la BD no limita la dirección.
export const AUDITION_EMAIL_MAX_CHARS = 120;
// Atajos del formulario: rellenan el label, que se puede seguir editando.
export const AUDITION_EMAIL_LABEL_PRESETS = ['Applications', 'Questions'] as const;
