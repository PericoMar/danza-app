import { RegistrationGranularity } from '@/types/adminStats';

export const REGISTRATION_GRANULARITY_LABELS: Record<RegistrationGranularity, string> = {
  [RegistrationGranularity.DAY]: 'Day',
  [RegistrationGranularity.WEEK]: 'Week',
  [RegistrationGranularity.MONTH]: 'Month',
};

export const REGISTRATION_GRANULARITY_OPTIONS: RegistrationGranularity[] = [
  RegistrationGranularity.DAY,
  RegistrationGranularity.WEEK,
  RegistrationGranularity.MONTH,
];
