// utils/resourceErrors.ts
// Traduce lo que devuelve Postgres a algo que una persona pueda leer.
//
// La validación de verdad vive en la base de datos (ver docs/adr/0002), así que
// siempre habrá errores que lleguen hasta aquí: el formulario valida antes, pero
// el último filtro es el CHECK. Lo que no puede pasar es que el usuario vea el
// nombre de una constraint.

/** Nombre de la constraint -> qué decirle a quien está rellenando el formulario. */
const BY_CONSTRAINT: Record<string, string> = {
  resources_website_url_http: 'The website needs to be a full address, like https://yourstudio.com.',
  resources_instagram_url_http: 'The Instagram link needs to be a full address, like https://instagram.com/yourstudio.',
  resources_facebook_url_http: 'The Facebook link needs to be a full address, like https://facebook.com/yourstudio.',
  resources_founded_year_range: 'That year does not look right.',
  resources_name_not_blank: 'Your profile needs a name.',
  resources_name_length: 'That name is too long.',
  resources_founder_name_length: 'That name is too long.',
  resources_address_not_blank: 'Write an address or tick "I have no fixed address".',
  resources_address_length: 'That address is too long.',
  resources_description_length: 'That description is too long.',
  resources_professional_experience_length: 'That text is too long.',
  resources_teaching_method_length: 'That text is too long.',
  resources_specialization_length: 'That text is too long.',
  resources_relation_to_dance_length: 'That text is too long.',
  resources_class_style_length: 'That text is too long.',
  resources_no_fixed_address_has_no_address:
    'Either an address or "no fixed address", not both.',
  resources_published_has_country: 'A published profile needs a country and a reach.',
  resource_emails_email_format: 'That email address does not look right.',
  resource_emails_email_unique: 'That email is already on your profile.',
  resource_emails_label_length: 'That label is too long.',
  resource_images_caption_length: 'That caption is too long.',
  resources_slug_unique: 'There is already a profile with that name. Try a slightly different one.',
  resources_user_id_key: 'This account already has a profile.',
};

const GENERIC = 'Something went wrong saving that. Have another go.';

/**
 * Nuestras propias excepciones (`raise exception 'resources: …'`) ya están
 * escritas para leerse; solo hay que quitarles el prefijo técnico.
 */
const OWN_PREFIXES = ['resources: ', 'save_resource: '];

export function resourceErrorMessage(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown })?.message === 'string'
          ? ((error as { message: string }).message)
          : '';

  if (!raw) return GENERIC;

  for (const name of Object.keys(BY_CONSTRAINT)) {
    if (raw.includes(name)) return BY_CONSTRAINT[name];
  }

  for (const prefix of OWN_PREFIXES) {
    const at = raw.indexOf(prefix);
    if (at !== -1) {
      const text = raw.slice(at + prefix.length).trim();
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
  }

  // Un error que no sabemos contar: el usuario ve una frase, nosotros el motivo.
  console.warn('[resources] unhandled error:', raw);
  return GENERIC;
}
