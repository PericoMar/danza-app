export const CompanyType = {
  COMPANY: 'company',
  PROFESSIONAL_EDUCATION: 'professional_education',
  EVENTS: 'events',
} as const;

export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

export const COMPANY_TYPE_OPTIONS: { value: CompanyType; label: string }[] = [
  { value: CompanyType.COMPANY, label: 'Company' },
  { value: CompanyType.PROFESSIONAL_EDUCATION, label: 'Professional Education' },
  { value: CompanyType.EVENTS, label: 'Events' },
];

export const ProfessionalEducationLevel = {
  PRE_PRO: 'pre_pro',
  SCHOOL_PRO: 'school_pro',
  UNIVERSITY: 'university',
} as const;

export type ProfessionalEducationLevel =
  (typeof ProfessionalEducationLevel)[keyof typeof ProfessionalEducationLevel];

export const PROFESSIONAL_EDUCATION_LEVEL_OPTIONS: { value: ProfessionalEducationLevel; label: string }[] = [
  { value: ProfessionalEducationLevel.PRE_PRO, label: 'Pre-pro' },
  { value: ProfessionalEducationLevel.SCHOOL_PRO, label: 'School pro' },
  { value: ProfessionalEducationLevel.UNIVERSITY, label: 'University' },
];
