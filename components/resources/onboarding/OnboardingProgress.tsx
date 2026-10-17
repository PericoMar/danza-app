import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/theme/colors';
import { INTER, MONO_LABEL } from '@/theme/companies';

interface OnboardingProgressProps {
  /** Pantalla actual, empezando en 1. */
  current: number;
  total: number;
  /** `completeness_pct` de la vista: campos contestados sobre los que aplican. */
  completeness: number;
}

/**
 * Lo que lleva hecho, con dos números distintos a propósito: por qué pantalla
 * va (predecible, se mueve siempre) y cuánto perfil tiene (lo que de verdad le
 * acerca a publicar).
 */
export default function OnboardingProgress({
  current,
  total,
  completeness,
}: OnboardingProgressProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.step}>
          Step {current} of {total}
        </Text>
        <Text style={styles.pct}>{completeness}% of your profile</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(2, Math.min(100, completeness))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  step: {
    fontFamily: MONO_LABEL,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  pct: {
    fontFamily: INTER,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  track: {
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.rule,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.text,
  },
});
