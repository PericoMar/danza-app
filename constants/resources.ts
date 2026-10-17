// Resources: valores que comparten el formulario, el listado y la BD.
// Los límites son espejo de los CHECK de `supabase/migrations/*_resources.sql`:
// si cambia uno, cambia el otro.

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { ResourceType } from '@/types/resource';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Carpeta del bucket `media` donde van el logo y la galería de una ficha. La
// policy de storage solo deja escribir en `resources/<id>/`, que es justo lo
// que construye `buildImagePath(RESOURCE_STORAGE_FOLDER, name, resourceId)`.
export const RESOURCE_STORAGE_FOLDER = 'resources';

// Mirrors de los CHECK de la tabla `resources`.
export const RESOURCE_NAME_MAX_CHARS = 120;
export const RESOURCE_FOUNDER_NAME_MAX_CHARS = 120;
export const RESOURCE_ADDRESS_MAX_CHARS = 300;
export const RESOURCE_DESCRIPTION_MAX_CHARS = 5000;
/** professional_experience, teaching_method, specialization, relation_to_dance, class_style. */
export const RESOURCE_LONG_TEXT_MAX_CHARS = 2000;
export const RESOURCE_EMAIL_LABEL_MAX_CHARS = 60;
export const RESOURCE_IMAGE_CAPTION_MAX_CHARS = 200;

// `resources_founded_year_range`. El tope real lo pone el año actual: el CHECK
// no puede mirar la fecha porque tiene que ser inmutable.
export const RESOURCE_FOUNDED_YEAR_MIN = 1800;
export const resourceFoundedYearMax = () => new Date().getFullYear();

// Mismo patrón que los CHECK `resources_*_url_http`.
export const RESOURCE_URL_PATTERN = /^https?:\/\/\S+$/i;

// Cuántas imágenes de galería acepta el formulario. La BD no pone techo; el
// mínimo por tipo lo dice `resource_type_fields.min_count`.
export const RESOURCE_IMAGES_MAX = 12;

// Cuántos emails de contacto puede añadir una ficha desde el formulario.
export const RESOURCE_EMAILS_MAX = 3;

/**
 * Icono de cada tipo en el selector y en las tarjetas (familia Ionicons, la
 * que ya usa el resto de la app).
 */
export const RESOURCE_TYPE_ICON: Record<ResourceType, IconName> = {
  [ResourceType.DANCE_SCHOOL]: 'school-outline',
  [ResourceType.FREELANCE_TEACHER]: 'person-outline',
  [ResourceType.PHOTOGRAPHER]: 'camera-outline',
  [ResourceType.PHYSIOTHERAPIST]: 'medkit-outline',
  [ResourceType.MOVEMENT_STUDIO]: 'body-outline',
  [ResourceType.PERSONAL_TRAINER]: 'barbell-outline',
  [ResourceType.NUTRITIONIST]: 'nutrition-outline',
  [ResourceType.GENERAL_WELLBEING]: 'leaf-outline',
};
