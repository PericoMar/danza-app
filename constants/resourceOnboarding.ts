// El texto del onboarding de Resources.
//
// Reparto a propósito: la base de datos (`resource_type_fields`) dice QUÉ se
// pregunta a cada tipo y en qué orden; este archivo dice CÓMO suena. Arreglar
// una errata no debería ser una migración.
//
// Los `Record<...>` completos obligan al compilador a avisar si se añade un
// tipo, un paso o un campo y se olvida su texto.

import {
  AccountType,
  ResourceField,
  ResourceOnboardingStep,
  ResourcePhotographyWorkType,
  ResourceRegionScope,
  ResourceStudentGoal,
  ResourceType,
} from '@/types/resource';

type Copy = { title: string; subtitle?: string };
type FieldCopy = { label: string; placeholder?: string; help?: string };

// ---------------------------------------------------------------------------
// Paso 0: ¿bailarín o profesional?
// ---------------------------------------------------------------------------

export const ACCOUNT_TYPE_COPY: Record<AccountType, { title: string; description: string }> = {
  [AccountType.DANCER]: {
    title: "I'm a dancer",
    description: 'Find auditions, follow companies and write reviews.',
  },
  [AccountType.PROFESSIONAL]: {
    title: 'I offer something to dancers',
    description: 'A school, classes, photography, physio, wellbeing. Get listed in Resources.',
  },
};

// ---------------------------------------------------------------------------
// Paso 1: ¿qué eres?
// ---------------------------------------------------------------------------

export const RESOURCE_TYPE_COPY: Record<ResourceType, { title: string; description: string }> = {
  [ResourceType.DANCE_SCHOOL]: {
    title: 'Dance school',
    description: 'A school with its own classes and students.',
  },
  [ResourceType.FREELANCE_TEACHER]: {
    title: 'Freelance teacher',
    description: 'You teach or coach on your own.',
  },
  [ResourceType.PHOTOGRAPHER]: {
    title: 'Photographer',
    description: 'You shoot dancers, on stage or in the studio.',
  },
  [ResourceType.PHYSIOTHERAPIST]: {
    title: 'Physio or chiropractor',
    description: "You keep dancers' bodies working.",
  },
  [ResourceType.MOVEMENT_STUDIO]: {
    title: 'Yoga, pilates or barre studio',
    description: 'Classes dancers cross-train with.',
  },
  [ResourceType.PERSONAL_TRAINER]: {
    title: 'Personal trainer',
    description: 'Strength and conditioning for dancers.',
  },
  [ResourceType.NUTRITIONIST]: {
    title: 'Nutritionist',
    description: 'Food and fuelling for dancers.',
  },
  [ResourceType.GENERAL_WELLBEING]: {
    title: 'General wellbeing',
    description: 'Anything else that keeps dancers well.',
  },
};

/** Orden en el selector: lo que más busca un bailarín, primero. */
export const RESOURCE_TYPE_ORDER: ResourceType[] = [
  ResourceType.DANCE_SCHOOL,
  ResourceType.FREELANCE_TEACHER,
  ResourceType.PHOTOGRAPHER,
  ResourceType.PHYSIOTHERAPIST,
  ResourceType.MOVEMENT_STUDIO,
  ResourceType.PERSONAL_TRAINER,
  ResourceType.NUTRITIONIST,
  ResourceType.GENERAL_WELLBEING,
];

// ---------------------------------------------------------------------------
// Las pantallas
// ---------------------------------------------------------------------------

export const STEP_COPY: Record<ResourceOnboardingStep, Copy> = {
  [ResourceOnboardingStep.BASICS]: {
    title: "Let's start with the basics",
    subtitle: 'Nothing is final: you can change all of it while your profile is a draft.',
  },
  [ResourceOnboardingStep.REACH]: {
    title: 'Where do you work?',
    subtitle: 'This is what decides where dancers find you.',
  },
  [ResourceOnboardingStep.CONTACT]: {
    title: 'How do dancers reach you?',
  },
  [ResourceOnboardingStep.CRAFT]: {
    title: 'Tell us what you do',
  },
  [ResourceOnboardingStep.SHOWCASE]: {
    title: "Now let's make it look good",
    subtitle: 'The part dancers actually look at.',
  },
};

/**
 * Lo que cambia por tipo. Es la pantalla `craft` la que hace que el flujo deje
 * de parecer un formulario y parezca una conversación con un fotógrafo o con
 * una escuela.
 */
export const STEP_COPY_BY_TYPE: Partial<
  Record<ResourceType, Partial<Record<ResourceOnboardingStep, Copy>>>
> = {
  [ResourceType.DANCE_SCHOOL]: {
    [ResourceOnboardingStep.BASICS]: { title: 'What is your school called?' },
    [ResourceOnboardingStep.CRAFT]: {
      title: 'Tell us about your school',
      subtitle: 'What a dancer wants to know before walking in.',
    },
  },
  [ResourceType.FREELANCE_TEACHER]: {
    [ResourceOnboardingStep.BASICS]: { title: "What's your name?" },
    [ResourceOnboardingStep.CRAFT]: { title: 'How you teach' },
  },
  [ResourceType.PHOTOGRAPHER]: {
    [ResourceOnboardingStep.BASICS]: { title: 'Your name, or your studio name' },
    [ResourceOnboardingStep.CRAFT]: { title: 'Where you shoot' },
    [ResourceOnboardingStep.SHOWCASE]: {
      title: 'Your work',
      subtitle: 'This is the screen that gets you hired.',
    },
  },
  [ResourceType.PHYSIOTHERAPIST]: {
    [ResourceOnboardingStep.CRAFT]: { title: 'Your speciality' },
  },
  [ResourceType.MOVEMENT_STUDIO]: {
    [ResourceOnboardingStep.CRAFT]: { title: 'What your classes are like' },
  },
};

// ---------------------------------------------------------------------------
// Los campos
// ---------------------------------------------------------------------------

export const FIELD_COPY: Record<ResourceField, FieldCopy> = {
  [ResourceField.NAME]: { label: 'Name', placeholder: 'Ballet Studio Madrid' },
  [ResourceField.FOUNDED_YEAR]: {
    label: 'Year it started',
    placeholder: '2014',
    help: "Skip it if it doesn't apply to you.",
  },
  [ResourceField.FOUNDER_NAME]: {
    label: 'Director or founder',
    placeholder: 'Ana García',
  },
  [ResourceField.COUNTRY]: { label: 'Country' },
  [ResourceField.REGION]: { label: 'Where you reach' },
  [ResourceField.ADDRESS]: {
    label: 'Address',
    placeholder: 'Calle de la Danza 12, Madrid',
    help: "Or say you don't have a fixed one.",
  },
  [ResourceField.EMAILS]: {
    label: 'Contact email',
    placeholder: 'hello@yourstudio.com',
    help: 'The first one is the one dancers see first.',
  },
  [ResourceField.WEBSITE_URL]: { label: 'Website', placeholder: 'https://yourstudio.com' },
  [ResourceField.INSTAGRAM_URL]: {
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourstudio',
  },
  [ResourceField.FACEBOOK_URL]: {
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourstudio',
  },
  [ResourceField.PROFESSIONAL_EXPERIENCE]: {
    label: 'Professional experience',
    placeholder: 'Where you trained, where you danced, what you have been doing since.',
  },
  [ResourceField.DISCIPLINES]: { label: 'Disciplines' },
  [ResourceField.TEACHING_METHOD]: {
    label: 'Teaching method',
    placeholder: 'Vaganova, RAD, your own mix…',
  },
  [ResourceField.STUDENT_GOALS]: { label: 'What your students are after' },
  [ResourceField.SPECIALIZATION]: { label: 'Specialisation' },
  [ResourceField.RELATION_TO_DANCE]: {
    label: 'Your relation with dance',
    placeholder: 'Danced for 12 years, now I work almost only with dancers.',
    help: 'The thing that makes a dancer pick you over somebody generic.',
  },
  [ResourceField.CLASS_STYLE]: {
    label: 'What a class feels like',
    placeholder: 'Pace, intensity, how hard you push, how big the group is.',
  },
  [ResourceField.PHOTOGRAPHY_WORK_TYPES]: { label: 'Type of work' },
  [ResourceField.LOGO]: {
    label: 'Logo or photo',
    help: 'What identifies you across the directory.',
  },
  [ResourceField.DESCRIPTION]: {
    label: 'Description',
    placeholder: 'A few lines about what you offer and who it is for.',
  },
  [ResourceField.IMAGES]: { label: 'Gallery' },
};

export const FIELD_COPY_BY_TYPE: Partial<
  Record<ResourceType, Partial<Record<ResourceField, Partial<FieldCopy>>>>
> = {
  [ResourceType.DANCE_SCHOOL]: {
    [ResourceField.NAME]: { label: 'School name' },
    [ResourceField.FOUNDED_YEAR]: { label: 'Year the school opened' },
  },
  [ResourceType.FREELANCE_TEACHER]: {
    [ResourceField.NAME]: { label: 'Your name', placeholder: 'Ana García' },
    [ResourceField.FOUNDED_YEAR]: {
      label: 'Teaching since',
      help: 'Only if it adds something.',
    },
  },
  [ResourceType.PHOTOGRAPHER]: {
    [ResourceField.NAME]: { label: 'Your name or studio', placeholder: 'Ana García Photography' },
    [ResourceField.IMAGES]: {
      label: 'Your work',
      help: 'At least 3. Your profile is your portfolio: it is the only thing a dancer looks at before writing to you.',
    },
    [ResourceField.PROFESSIONAL_EXPERIENCE]: {
      label: 'Experience and how you work',
      placeholder: 'How a shoot goes, what you need from the dancer, what they get back.',
    },
  },
  [ResourceType.PHYSIOTHERAPIST]: {
    [ResourceField.SPECIALIZATION]: {
      label: 'Specialisation',
      placeholder: 'Hypermobility, foot and ankle, post-op, overuse injuries…',
    },
  },
  [ResourceType.MOVEMENT_STUDIO]: {
    [ResourceField.SPECIALIZATION]: {
      label: 'Methodology or speciality',
      placeholder: 'Vinyasa, reformer, classical barre…',
    },
  },
};

// ---------------------------------------------------------------------------
// Opciones de lista cerrada
// ---------------------------------------------------------------------------

export const REGION_SCOPE_COPY: Record<ResourceRegionScope, { title: string; description: string }> = {
  [ResourceRegionScope.FIXED]: {
    title: 'One region',
    description: 'Top placement in that region.',
  },
  [ResourceRegionScope.MULTIPLE]: {
    title: 'Up to 3 regions',
    description: 'More reach, but below the single-region ones in each of them.',
  },
  [ResourceRegionScope.NATIONWIDE]: {
    title: 'Nationwide',
    description: 'You show up in every search in your country, after everybody else.',
  },
};

/**
 * Se muestra al elegir el alcance, no escondido en un aviso al final: es la
 * regla que evita que todo el mundo se ponga en nationwide.
 */
export const REGION_SCOPE_DISCLAIMER =
  'Choosing one fixed region gives you top placement there. Selecting multiple regions (up to 3) ' +
  'increases your reach but ranks below the single-region profiles in each of them.';

export const STUDENT_GOAL_COPY: Record<ResourceStudentGoal, { title: string; description: string }> = {
  [ResourceStudentGoal.RECREATIONAL]: {
    title: 'For the love of it',
    description: 'People who dance because they enjoy it.',
  },
  [ResourceStudentGoal.VOCATIONAL]: {
    title: 'Vocational training',
    description: 'Students aiming at a professional career.',
  },
  [ResourceStudentGoal.PROFESSIONAL]: {
    title: 'Working professionals',
    description: 'Dancers already in the job, keeping in shape.',
  },
};

export const PHOTOGRAPHY_WORK_TYPE_COPY: Record<ResourcePhotographyWorkType, { title: string }> = {
  [ResourcePhotographyWorkType.INDOOR_STUDIO]: { title: 'Indoor studio' },
  [ResourcePhotographyWorkType.OUTDOOR_URBAN]: { title: 'Outdoor / urban' },
  [ResourcePhotographyWorkType.DANCE_SCHOOL_LOCATION]: { title: 'On location at dance schools' },
  [ResourcePhotographyWorkType.LIVE_THEATER]: { title: 'Live theatre / stage' },
};

// ---------------------------------------------------------------------------
// Textos sueltos del flujo
// ---------------------------------------------------------------------------

export const ONBOARDING_COPY = {
  /** Lo que se dice antes de pedir nada, para que la revisión no sorprenda al final. */
  reviewNotice: 'We check every profile by hand before it goes live, usually within a couple of days.',
  /** El muro de cuenta: enseña lo que ya lleva hecho. */
  accountWallTitle: 'Save what you have started',
  accountWallSubtitle: 'Create your account and your profile is kept. It takes less than reading this.',
  /** Botón de saltar un campo. */
  skip: 'Add this later',
  /** Salir sin perder nada. */
  saveAndExit: 'Save and finish later',
  /** Lo que falta para publicar. */
  missingOne: 'One thing left before we can review it',
  missingMany: (n: number) => `${n} things left before we can review it`,
  readyToSubmit: 'Ready to send for review',
  submit: 'Send for review',
  submitted: 'Sent. We will email you when it is live.',
} as const;
