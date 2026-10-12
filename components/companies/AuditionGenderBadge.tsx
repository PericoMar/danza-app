import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import CardBadge from './CardBadge';
import type { AuditionGenderRestriction } from '@/types/audition';

interface AuditionGenderBadgeProps {
  gender: AuditionGenderRestriction;
  style?: StyleProp<ViewStyle>;
}

const BADGE_COPY = {
  male: { label: 'Men only', a11y: 'Audition open to men only' },
  female: { label: 'Women only', a11y: 'Audition open to women only' },
} as const satisfies Record<AuditionGenderRestriction, { label: string; a11y: string }>;

/** Flags an audition restricted to a single gender. */
export default function AuditionGenderBadge({ gender, style }: AuditionGenderBadgeProps) {
  const copy = BADGE_COPY[gender];
  return <CardBadge icon={gender} label={copy.label} accessibilityLabel={copy.a11y} style={style} />;
}
