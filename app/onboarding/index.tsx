// app/onboarding/index.tsx
// El alta de un profesional, de principio a fin.
//
// El orden no es casual: primero el tipo (un clic, sin teclado), luego el
// nombre, y solo entonces la cuenta — con lo ya hecho a la vista. Desde ahí
// cada pantalla guarda lo suyo, y por dónde seguir lo dice la base de datos.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import SiteHeader from '@/components/common/SiteHeader';
import { AccountButton, AccountTextField, accountStyles } from '@/components/account';
import AuthCard from '@/components/auth/AuthCard';
import SignUpForm from '@/components/auth/SignUpForm';
import ChoiceCard from '@/components/resources/ChoiceCard';
import OnboardingStep from '@/components/resources/onboarding/OnboardingStep';
import OnboardingReview from '@/components/resources/onboarding/OnboardingReview';
import { useResourceOnboarding } from '@/hooks/useResourceOnboarding';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER, MONO_LABEL, loadCompaniesFonts, pageHPadding } from '@/theme/companies';
import {
  ONBOARDING_CONTENT_MAX_WIDTH,
  ONBOARDING_PREVIEW_MIN_WIDTH,
  ONBOARDING_WIDE_MAX_WIDTH,
} from '@/constants/layout';
import { ONBOARDING_ROUTE, RESOURCES_ROUTE } from '@/constants/routes';
import { RESOURCE_TYPE_ICON, RESOURCE_NAME_MAX_CHARS } from '@/constants/resources';
import {
  ONBOARDING_COPY,
  RESOURCE_TYPE_COPY,
  RESOURCE_TYPE_ORDER,
} from '@/constants/resourceOnboarding';
import { AccountType, ResourceOnboardingStep } from '@/types/resource';
import { fieldCopy, resumeStep, stepsOf } from '@/utils/resourceOnboarding';

/** La pantalla de repaso no es un paso del guion: va después del último. */
const REVIEW = 'review' as const;
type Screen = ResourceOnboardingStep | typeof REVIEW;

export default function OnboardingScreen() {
  loadCompaniesFonts();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const {
    phase,
    resource,
    draft,
    type,
    typeFields,
    countries,
    regions,
    disciplines,
    saving,
    error,
    chooseType,
    chooseName,
    saveCountry,
    saveStep,
    skipField,
    unskipField,
    submitForReview,
  } = useResourceOnboarding();

  const [name, setName] = useState('');
  const [screen, setScreen] = useState<Screen | null>(null);

  const steps = stepsOf(typeFields);

  // Al entrar, por donde lo dejó: el primer campo que no está ni contestado ni
  // saltado. Lo calcula la vista, así que aquí solo se obedece.
  useEffect(() => {
    if (!resource || typeFields.length === 0 || screen !== null) return;
    setScreen(resource.next_field === null ? REVIEW : resumeStep(resource, typeFields));
  }, [resource, typeFields, screen]);

  useEffect(() => {
    if (draft?.name) setName(draft.name);
  }, [draft?.name]);

  const exit = () => router.replace(RESOURCES_ROUTE);

  const goToStep = (step: ResourceOnboardingStep) => setScreen(step);

  const advance = () => {
    if (!screen || screen === REVIEW) return;
    const next = steps[steps.indexOf(screen) + 1];
    setScreen(next ?? REVIEW);
  };

  const back = () => {
    if (screen === REVIEW) {
      setScreen(steps[steps.length - 1] ?? null);
      return;
    }
    if (!screen) return;
    const previous = steps[steps.indexOf(screen) - 1];
    if (previous) setScreen(previous);
  };

  const body = () => {
    if (phase === 'loading') {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.text} />
        </View>
      );
    }

    // ─── Paso 1: qué eres ───
    if (phase === 'pick-type') {
      return (
        <View style={styles.block}>
          <Text style={styles.eyebrow}>Get listed</Text>
          <Text style={styles.title}>What do you offer dancers?</Text>
          <Text style={accountStyles.bodyText}>
            Pick what describes you best. You can change it while your profile is a draft.
          </Text>

          <View style={styles.cards}>
            {RESOURCE_TYPE_ORDER.map((option, position) => (
              <ChoiceCard
                key={option}
                index={position}
                title={RESOURCE_TYPE_COPY[option].title}
                description={RESOURCE_TYPE_COPY[option].description}
                icon={RESOURCE_TYPE_ICON[option]}
                selected={type === option}
                onPress={() => chooseType(option)}
              />
            ))}
          </View>

          <Text style={accountStyles.hintText}>{ONBOARDING_COPY.reviewNotice}</Text>
        </View>
      );
    }

    // ─── Paso 2: el nombre ───
    if (phase === 'name' && type) {
      const copy = fieldCopy(type, 'name');

      return (
        <View style={styles.block}>
          <Text style={styles.eyebrow}>{RESOURCE_TYPE_COPY[type].title}</Text>
          <Text style={styles.title}>{copy.label}</Text>

          <AccountTextField
            label={copy.label}
            value={name}
            onChangeText={setName}
            placeholder={copy.placeholder}
            inputProps={{ maxLength: RESOURCE_NAME_MAX_CHARS, autoFocus: true }}
          />

          <View style={styles.actions}>
            <AccountButton label="Back" variant="ghost" onPress={() => chooseType(type)} />
            <AccountButton
              label="Continue"
              onPress={() => chooseName(name)}
              disabled={name.trim() === ''}
              loading={saving}
            />
          </View>
        </View>
      );
    }

    // ─── Paso 3: el muro de cuenta, con lo ya hecho delante ───
    if (phase === 'account' && type) {
      return (
        <AuthCard
          title={ONBOARDING_COPY.accountWallTitle}
          subtitle={`${draft?.name} · ${RESOURCE_TYPE_COPY[type].title}. ${ONBOARDING_COPY.accountWallSubtitle}`}
          showLogo={false}
        >
          <SignUpForm
            accountType={AccountType.PROFESSIONAL}
            submitLabel="Create account and keep going"
            emailRedirectPath={ONBOARDING_ROUTE}
          />
        </AuthCard>
      );
    }

    // ─── El guion ───
    if (resource && screen && screen !== REVIEW) {
      return (
        <OnboardingStep
          resource={resource}
          typeFields={typeFields}
          step={screen}
          steps={steps}
          countries={countries}
          regions={regions}
          disciplines={disciplines}
          saving={saving}
          error={error}
          onCountryChange={saveCountry}
          onSave={saveStep}
          onSkip={skipField}
          onBack={back}
          onDone={advance}
          onExit={exit}
        />
      );
    }

    if (resource && screen === REVIEW) {
      return (
        <OnboardingReview
          resource={resource}
          typeFields={typeFields}
          saving={saving}
          error={error}
          onGoToStep={goToStep}
          onUnskip={unskipField}
          onSubmit={submitForReview}
          onExit={exit}
        />
      );
    }

    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.text} />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Head>
        <title>Get listed · danza.app</title>
      </Head>
      <SiteHeader />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.page,
            {
              // Con la tarjeta en vivo al lado, la columna necesita sitio para
              // las dos cosas; sin ella, se queda estrecha y se lee mejor.
              maxWidth:
                width >= ONBOARDING_PREVIEW_MIN_WIDTH
                  ? ONBOARDING_WIDE_MAX_WIDTH
                  : ONBOARDING_CONTENT_MAX_WIDTH,
              paddingHorizontal: pageHPadding(width),
            },
          ]}
        >
          {body()}
          {error && phase !== 'steps' ? (
            <Text style={accountStyles.errorText}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 36,
  },
  page: {
    width: '100%',
    gap: 20,
  },
  loading: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  block: {
    gap: 14,
  },
  eyebrow: {
    fontFamily: MONO_LABEL,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.text,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
});
