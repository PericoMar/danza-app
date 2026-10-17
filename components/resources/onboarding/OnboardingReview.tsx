import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER, MONO_LABEL } from '@/theme/companies';
import { AccountButton, accountStyles, webPointer } from '@/components/account';
import ResourceCard from '@/components/resources/ResourceCard';
import { ONBOARDING_COPY } from '@/constants/resourceOnboarding';
import {
  Resource,
  ResourceField,
  ResourceOnboardingStep,
  ResourceStatus,
  ResourceTypeField,
} from '@/types/resource';
import { fieldCopy, stepOfField } from '@/utils/resourceOnboarding';

interface OnboardingReviewProps {
  resource: Resource;
  typeFields: ResourceTypeField[];
  saving: boolean;
  error: string | null;
  /** Volver a la pantalla donde se arregla un campo. */
  onGoToStep: (step: ResourceOnboardingStep) => void;
  onUnskip: (field: ResourceField) => void;
  onSubmit: () => void;
  onExit: () => void;
}

/**
 * La última pantalla: su tarjeta tal como la verán los bailarines, lo que
 * falta, y el botón de enviar. Después no hay pantalla muerta: si ya está
 * enviada, esto mismo le dice en qué estado está.
 */
export default function OnboardingReview({
  resource,
  typeFields,
  saving,
  error,
  onGoToStep,
  onUnskip,
  onSubmit,
  onExit,
}: OnboardingReviewProps) {
  const missing = resource.missing_fields;
  const skipped = resource.skipped_fields.filter((f) => !missing.includes(f));
  const sent = resource.status !== ResourceStatus.DRAFT;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>Almost there</Text>
        <Text style={styles.title}>
          {sent ? 'This is what we are reviewing' : 'This is how dancers will see you'}
        </Text>
      </View>

      <ResourceCard resource={resource} />

      {missing.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>
            {missing.length === 1
              ? ONBOARDING_COPY.missingOne
              : ONBOARDING_COPY.missingMany(missing.length)}
          </Text>

          {missing.map((field) => {
            const step = stepOfField(typeFields, field);
            return (
              <Pressable
                key={field}
                onPress={() => step && onGoToStep(step)}
                accessibilityRole="button"
                style={[styles.row, webPointer]}
              >
                <Ionicons name="ellipse-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.rowLabel}>{fieldCopy(resource.type, field).label}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{ONBOARDING_COPY.readyToSubmit}</Text>
          <Text style={accountStyles.hintText}>{ONBOARDING_COPY.reviewNotice}</Text>
        </View>
      )}

      {skipped.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Left for later</Text>
          <Text style={accountStyles.hintText}>
            None of these stops you from publishing, but each one makes your profile easier to pick.
          </Text>
          {skipped.map((field) => (
            <Pressable
              key={field}
              onPress={() => onUnskip(field)}
              accessibilityRole="button"
              style={[styles.row, webPointer]}
            >
              <Ionicons name="add" size={14} color={Colors.textMuted} />
              <Text style={styles.rowLabel}>{fieldCopy(resource.type, field).label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? <Text style={accountStyles.errorText}>{error}</Text> : null}

      {sent ? (
        <View style={styles.sent}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.successText} />
          <Text style={styles.sentLabel}>{ONBOARDING_COPY.submitted}</Text>
        </View>
      ) : (
        <AccountButton
          label={ONBOARDING_COPY.submit}
          onPress={onSubmit}
          loading={saving}
          disabled={missing.length > 0}
        />
      )}

      <Pressable onPress={onExit} accessibilityRole="button" style={[styles.exit, webPointer]}>
        <Text style={styles.exitLabel}>
          {sent ? 'Back to the app' : ONBOARDING_COPY.saveAndExit}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 22,
  },
  head: {
    gap: 6,
  },
  eyebrow: {
    fontFamily: MONO_LABEL,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.text,
  },
  block: {
    gap: 8,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  blockTitle: {
    fontFamily: INTER,
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  rowLabel: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.textLightDark,
  },
  sent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    backgroundColor: Colors.successBg,
  },
  sentLabel: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.successText,
  },
  exit: {
    alignSelf: 'flex-start',
  },
  exitLabel: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
