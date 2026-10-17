import {
  emptyResourceEmail,
  fieldCopy,
  fieldsOfStep,
  missingCount,
  normalizeUrl,
  payloadForFields,
  resumeStep,
  stepCopy,
  stepOfField,
  stepsOf,
  validateFields,
  valuesFromResource,
  type ResourceFormValues,
} from '@/utils/resourceOnboarding';
import {
  Resource,
  ResourceField,
  ResourceOnboardingStep,
  ResourcePhotographyWorkType,
  ResourceRegionScope,
  ResourceStatus,
  ResourceStudentGoal,
  ResourceType,
  ResourceTypeField,
} from '@/types/resource';

const typeField = (
  field: ResourceField,
  step: ResourceOnboardingStep,
  position: number,
  extra: Partial<ResourceTypeField> = {}
): ResourceTypeField => ({
  type: ResourceType.PHOTOGRAPHER,
  field,
  step,
  position,
  is_required: false,
  min_count: null,
  ...extra,
});

const resource = (overrides: Partial<Resource> = {}): Resource => ({
  id: 'r1',
  user_id: 'u1',
  type: ResourceType.PHOTOGRAPHER,
  status: ResourceStatus.DRAFT,
  name: 'Ana García Photography',
  slug: 'ana-garcia-photography',
  country_iso_code: 'ES',
  country_name: 'Spain',
  region_scope: ResourceRegionScope.NATIONWIDE,
  address: null,
  no_fixed_address: true,
  website_url: null,
  instagram_url: null,
  facebook_url: null,
  logo_url: null,
  description: null,
  verified: false,
  founded_year: null,
  founder_name: null,
  professional_experience: null,
  teaching_method: null,
  specialization: null,
  relation_to_dance: null,
  class_style: null,
  published_at: null,
  created_at: '2026-10-17T00:00:00Z',
  updated_at: '2026-10-17T00:00:00Z',
  regions: [],
  emails: [],
  images: [],
  disciplines: [],
  student_goals: [],
  photography_work_types: [],
  placement_rank: 2,
  missing_fields: [],
  skipped_fields: [],
  completeness_pct: 40,
  next_field: null,
  next_step: null,
  ...overrides,
});

const values = (overrides: Partial<ResourceFormValues> = {}): ResourceFormValues => ({
  ...valuesFromResource(null),
  ...overrides,
});

describe('el guion de un tipo', () => {
  const fields = [
    typeField(ResourceField.IMAGES, ResourceOnboardingStep.SHOWCASE, 2),
    typeField(ResourceField.NAME, ResourceOnboardingStep.BASICS, 0),
    typeField(ResourceField.LOGO, ResourceOnboardingStep.SHOWCASE, 0),
    typeField(ResourceField.DESCRIPTION, ResourceOnboardingStep.SHOWCASE, 1),
  ];

  it('ordena las pantallas como el flujo, no como llegan', () => {
    expect(stepsOf(fields)).toEqual([
      ResourceOnboardingStep.BASICS,
      ResourceOnboardingStep.SHOWCASE,
    ]);
  });

  it('ordena los campos de una pantalla por su posición', () => {
    expect(fieldsOfStep(fields, ResourceOnboardingStep.SHOWCASE).map((f) => f.field)).toEqual([
      ResourceField.LOGO,
      ResourceField.DESCRIPTION,
      ResourceField.IMAGES,
    ]);
  });

  it('sabe en qué pantalla se arregla un campo', () => {
    expect(stepOfField(fields, ResourceField.IMAGES)).toBe(ResourceOnboardingStep.SHOWCASE);
    expect(stepOfField(fields, null)).toBeNull();
  });

  it('entra por donde dice la base de datos, y si no queda nada, por la última', () => {
    expect(
      resumeStep(resource({ next_step: ResourceOnboardingStep.SHOWCASE }), fields)
    ).toBe(ResourceOnboardingStep.SHOWCASE);
    expect(resumeStep(resource({ next_step: null }), fields)).toBe(
      ResourceOnboardingStep.SHOWCASE
    );
  });
});

describe('el texto', () => {
  it('usa el del tipo cuando lo hay y el general cuando no', () => {
    expect(fieldCopy(ResourceType.FREELANCE_TEACHER, ResourceField.NAME).label).toBe('Your name');
    expect(fieldCopy(ResourceType.PHYSIOTHERAPIST, ResourceField.NAME).label).toBe('Name');
  });

  it('mezcla el texto del tipo con el general en vez de sustituirlo', () => {
    const copy = fieldCopy(ResourceType.PHOTOGRAPHER, ResourceField.IMAGES);
    expect(copy.label).toBe('Your work');
    expect(copy.help).toContain('At least 3');
  });

  it('cambia el título de la pantalla según el tipo', () => {
    expect(stepCopy(ResourceType.PHOTOGRAPHER, ResourceOnboardingStep.CRAFT).title).toBe(
      'Where you shoot'
    );
    expect(stepCopy(ResourceType.NUTRITIONIST, ResourceOnboardingStep.CRAFT).title).toBe(
      'Tell us what you do'
    );
  });
});

describe('payloadForFields', () => {
  it('manda solo los campos de la pantalla, para no pisar el resto', () => {
    const payload = payloadForFields([ResourceField.NAME], values({ name: ' Studio  ' }));
    expect(payload).toEqual({ name: 'Studio' });
  });

  it('convierte el texto vacío en null (la columna es nullable, no cadena vacía)', () => {
    const payload = payloadForFields([ResourceField.WEBSITE_URL], values({ website_url: '   ' }));
    expect(payload.website_url).toBeNull();
  });

  it('con "no tengo dirección fija" no manda dirección', () => {
    const payload = payloadForFields(
      [ResourceField.ADDRESS],
      values({ no_fixed_address: true, address: 'Calle Falsa 123' })
    );
    expect(payload).toEqual({ no_fixed_address: true, address: null });
  });

  it('un año que no es un año es null, no NaN', () => {
    expect(payloadForFields([ResourceField.FOUNDED_YEAR], values({ founded_year: '' })).founded_year)
      .toBeNull();
    expect(
      payloadForFields([ResourceField.FOUNDED_YEAR], values({ founded_year: '2014' })).founded_year
    ).toBe(2014);
  });

  it('tira las filas de email vacías y deja la etiqueta en null', () => {
    const payload = payloadForFields(
      [ResourceField.EMAILS],
      values({
        emails: [
          { email: ' hola@x.com ', label: ' Bookings ' },
          emptyResourceEmail(),
        ],
      })
    );
    expect(payload.emails).toEqual([{ email: 'hola@x.com', label: 'Bookings' }]);
  });

  it('el alcance viaja con sus regiones, porque la BD los valida juntos', () => {
    const payload = payloadForFields(
      [ResourceField.REGION],
      values({ region_scope: ResourceRegionScope.MULTIPLE, region_ids: ['a', 'b'] })
    );
    expect(payload).toEqual({
      region_scope: ResourceRegionScope.MULTIPLE,
      region_ids: ['a', 'b'],
    });
  });

  it('las selecciones múltiples van como ids o como enums, según la tabla', () => {
    const payload = payloadForFields(
      [
        ResourceField.DISCIPLINES,
        ResourceField.STUDENT_GOALS,
        ResourceField.PHOTOGRAPHY_WORK_TYPES,
      ],
      values({
        discipline_ids: ['d1'],
        student_goals: [ResourceStudentGoal.VOCATIONAL],
        photography_work_types: [ResourcePhotographyWorkType.LIVE_THEATER],
      })
    );
    expect(payload).toEqual({
      discipline_ids: ['d1'],
      student_goals: [ResourceStudentGoal.VOCATIONAL],
      photography_work_types: [ResourcePhotographyWorkType.LIVE_THEATER],
    });
  });
});

describe('valuesFromResource', () => {
  it('una ficha nueva empieza con todo vacío, no con undefined', () => {
    const empty = valuesFromResource(null);
    expect(empty.name).toBe('');
    expect(empty.region_scope).toBeNull();
    expect(empty.emails).toEqual([]);
    expect(empty.no_fixed_address).toBe(false);
  });

  it('lee lo guardado, incluidas las hijas, en el formato de los inputs', () => {
    const loaded = valuesFromResource(
      resource({
        founded_year: 2014,
        emails: [{ id: 'e1', email: 'hola@x.com', label: null }],
        regions: [{ id: 'g1', name: 'Madrid', slug: 'madrid', country_iso_code: 'ES' }],
        images: [{ id: 'i1', image_url: 'https://e.com/1.jpg', caption: null }],
      })
    );

    expect(loaded.founded_year).toBe('2014');
    expect(loaded.emails).toEqual([{ email: 'hola@x.com', label: '' }]);
    expect(loaded.region_ids).toEqual(['g1']);
    expect(loaded.images).toEqual([{ image_url: 'https://e.com/1.jpg', caption: '' }]);
  });
});

describe('normalizeUrl', () => {
  it('pone el esquema que nadie escribe', () => {
    expect(normalizeUrl('danza-app.com')).toBe('https://danza-app.com');
    expect(normalizeUrl('  www.danza-app.com ')).toBe('https://www.danza-app.com');
  });

  it('no toca lo que ya lo trae', () => {
    expect(normalizeUrl('http://danza-app.com')).toBe('http://danza-app.com');
    expect(normalizeUrl('https://danza-app.com')).toBe('https://danza-app.com');
  });

  it('vacío sigue vacío: el campo es opcional', () => {
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('validateFields', () => {
  const only = (f: ResourceField) => [typeField(f, ResourceOnboardingStep.CONTACT, 0)];

  it('acepta una web sin esquema, porque se lo ponemos al guardar', () => {
    expect(
      validateFields(only(ResourceField.WEBSITE_URL), values({ website_url: 'danza-app.com' }))
    ).toEqual({});
    expect(
      payloadForFields([ResourceField.WEBSITE_URL], values({ website_url: 'danza-app.com' }))
        .website_url
    ).toBe('https://danza-app.com');
  });

  it('rechaza lo que no es una dirección, y lo dice en cristiano', () => {
    expect(
      validateFields(only(ResourceField.WEBSITE_URL), values({ website_url: 'no es una web' }))
    ).toEqual({ website_url: 'That does not look like a web address.' });
  });

  it('avisa de un email mal escrito y de uno repetido', () => {
    expect(
      validateFields(only(ResourceField.EMAILS), values({ emails: [{ email: 'ana@', label: '' }] }))
    ).toEqual({ emails: 'That email address does not look right.' });

    expect(
      validateFields(
        only(ResourceField.EMAILS),
        values({
          emails: [
            { email: 'ana@x.com', label: '' },
            { email: 'ANA@x.com', label: '' },
          ],
        })
      )
    ).toEqual({ emails: 'That email is repeated.' });
  });

  it('no se queja de un campo vacío: en un borrador nada es obligatorio', () => {
    expect(validateFields(only(ResourceField.WEBSITE_URL), values())).toEqual({});
    expect(validateFields(only(ResourceField.EMAILS), values())).toEqual({});
  });

  it('comprueba el número de regiones antes de que lo haga el trigger', () => {
    const regionField = [typeField(ResourceField.REGION, ResourceOnboardingStep.REACH, 1)];

    expect(
      validateFields(regionField, values({ region_scope: ResourceRegionScope.FIXED, region_ids: [] }))
    ).toEqual({ region: 'Pick one region.' });

    expect(
      validateFields(
        regionField,
        values({ region_scope: ResourceRegionScope.MULTIPLE, region_ids: ['a'] })
      )
    ).toEqual({ region: 'Pick between 2 and 3 regions.' });

    expect(
      validateFields(
        regionField,
        values({ region_scope: ResourceRegionScope.NATIONWIDE, region_ids: [] })
      )
    ).toEqual({});
  });

  it('acota el año de fundación al rango que acepta la columna', () => {
    const yearField = [typeField(ResourceField.FOUNDED_YEAR, ResourceOnboardingStep.BASICS, 1)];
    expect(validateFields(yearField, values({ founded_year: '1700' })).founded_year).toContain('1800');
    expect(validateFields(yearField, values({ founded_year: '2014' }))).toEqual({});
  });
});

describe('missingCount', () => {
  it('cuenta lo que la vista dice que falta', () => {
    expect(missingCount(null)).toBe(0);
    expect(
      missingCount(resource({ missing_fields: [ResourceField.EMAILS, ResourceField.LOGO] }))
    ).toBe(2);
  });
});
