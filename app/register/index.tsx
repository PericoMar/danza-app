import { useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import SiteHeader from '@/components/common/SiteHeader';
import AuthCard from '@/components/auth/AuthCard';
import SignUpForm from '@/components/auth/SignUpForm';
import { authStyles } from '@/components/auth/authStyles';
import { useAuthScale } from '@/components/auth/useAuthScale';
import ChoiceCard from '@/components/resources/ChoiceCard';
import { AUTH_CHOICE_MAX_WIDTH } from '@/constants/layout';
import { ACCOUNT_TYPE_COPY } from '@/constants/resourceOnboarding';
import { ONBOARDING_ROUTE } from '@/constants/routes';
import { AccountType } from '@/types/resource';

/** Lo que tarda en irse lo elegido antes de que entre lo siguiente. */
const SWAP_OUT_MS = 170;
const SWAP_IN_MS = 280;

/**
 * El registro empieza por una pregunta, no por un formulario: bailarín o
 * profesional. Cada uno sigue por su camino — el bailarín con el email y la
 * contraseña de siempre, el profesional por el onboarding, que le pide la
 * cuenta más adelante, cuando ya ha construido algo que no quiere perder.
 *
 * Elegir no corta: lo elegido se desvanece y entra lo siguiente. En la pantalla
 * donde más gente se cae, un salto seco se siente como un error.
 */
export default function RegisterScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const scale = useAuthScale();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  const leave = (then: () => void) => {
    Animated.timing(fade, {
      toValue: 0,
      duration: SWAP_OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      then();
      Animated.timing(fade, {
        toValue: 1,
        duration: SWAP_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const loginFooter = (
    <Text style={[authStyles.bottomText, scale.bottomText]}>
      Already have an account?{' '}
      <Link href="/login">
        <Text style={authStyles.link}>Login</Text>
      </Link>
    </Text>
  );

  const swap = {
    opacity: fade,
    transform: [
      { translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };

  if (accountType === AccountType.DANCER) {
    return (
      <View style={{ flex: 1 }}>
        <SiteHeader />
        <AuthCard
          title="Create an account"
          subtitle="Join to save favorite companies and get notified about new auditions."
          footer={loginFooter}
        >
          <Animated.View style={swap}>
            <SignUpForm accountType={AccountType.DANCER} initialEmail={emailParam} />
          </Animated.View>
        </AuthCard>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SiteHeader />
      <AuthCard
        title="Create an account"
        subtitle="First, which one are you?"
        footer={loginFooter}
        maxWidth={AUTH_CHOICE_MAX_WIDTH}
      >
        {/* En fila: `flexGrow` reparte el ancho y las dos igualan altura. En
            columna, `flexGrow` repartía el ALTO y quedaban medio vacías. */}
        <Animated.View style={[styles.cards, swap]}>
          <ChoiceCard
            index={0}
            size="large"
            showArrow
            icon="body-outline"
            title={ACCOUNT_TYPE_COPY[AccountType.DANCER].title}
            description={ACCOUNT_TYPE_COPY[AccountType.DANCER].description}
            onPress={() => leave(() => setAccountType(AccountType.DANCER))}
          />
          <ChoiceCard
            index={1}
            size="large"
            showArrow
            icon="briefcase-outline"
            title={ACCOUNT_TYPE_COPY[AccountType.PROFESSIONAL].title}
            description={ACCOUNT_TYPE_COPY[AccountType.PROFESSIONAL].description}
            onPress={() => leave(() => router.push(ONBOARDING_ROUTE))}
          />
        </Animated.View>
      </AuthCard>
    </View>
  );
}

const styles = StyleSheet.create({
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 8,
  },
});
