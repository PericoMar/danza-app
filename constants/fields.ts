// src/constants/reviewFields.ts

export type ReviewFieldKey =
  | 'salary'
  | 'repertoire'
  | 'staff'
  | 'schedule'
  | 'facilities'
  | 'colleagues'
  | 'city';

export const REVIEW_FIELDS: { key: ReviewFieldKey; label: string }[] = [
  { key: 'salary', label: 'Salary & Compensation' },
  { key: 'repertoire', label: 'Repertoire, Operas, Touring & Roles' },
  { key: 'staff', label: 'Staff, Classes & Rehearsals' },
  { key: 'schedule', label: 'Schedule & Holidays' },
  { key: 'facilities', label: 'Facilities, Wellbeing & Injuries' },
  { key: 'colleagues', label: 'Colleagues & General Mood' },
  { key: 'city', label: 'City, Transport & Living' },
];

export const MIN_FIELDS_REQUIRED = 1;