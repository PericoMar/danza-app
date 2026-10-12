import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import CardBadge from './CardBadge';
import type { AuditionAgeRange } from '@/types/audition';
import { describeAgeRange, formatAgeRange } from '@/utils/auditionDisplay';

interface AuditionAgeBadgeProps {
  range: AuditionAgeRange;
  style?: StyleProp<ViewStyle>;
}

/** Flags an audition with an age limit ("Age 18–25"); renders nothing without one. */
export default function AuditionAgeBadge({ range, style }: AuditionAgeBadgeProps) {
  const text = formatAgeRange(range);
  if (!text) return null;
  return (
    <CardBadge
      icon="hourglass"
      label={`Age ${text}`}
      accessibilityLabel={`Audition open to dancers ${describeAgeRange(range)}`}
      style={style}
    />
  );
}
