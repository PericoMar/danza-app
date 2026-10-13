import { useEffect, useRef, useState } from 'react';
import { TextInput, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { Link, useLocalSearchParams } from 'expo-router';
import TermsModal from '@/components/modals/TermsModal';
import SiteHeader from '@/components/common/SiteHeader';
import AuthCard from '@/components/auth/AuthCard';
import AuthTextInput from '@/components/auth/AuthTextInput';
import AuthButton from '@/components/auth/AuthButton';
import { authStyles } from '@/components/auth/authStyles';
import { useAuthScale } from '@/components/auth/useAuthScale';
import { Colors } from '@/theme/colors';

export default function RegisterScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState('');
  const scale = useAuthScale();

  // Pre-fill email from query param (e.g., from newsletter signup)
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (loading) return;
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms and Conditions.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // On native, confirming the email needs to deep-link back into the
        // app (myapp://companies) instead of Supabase's default web URL,
        // otherwise confirmation lands the user on the website with no session.
        ...(Platform.OS !== 'web'
          ? { options: { emailRedirectTo: Linking.createURL('/companies') } }
          : {}),
      });

      if (error) {
        setError(error.message || 'Registration failed. Please try again.');
      } else if (data?.user && !data.session) {
        // Email ya registrado pero no confirmado aún
        setError('Confirmation email sent, check your inbox.');
      } else if (data?.session) {
        // Registro + login automático (confirmación desactivada). No navegar
        // aquí, igual que en login: el cambio de sesión remonta AppShell
        // (key={sessionKey}) y AuthNavigator ya lleva de /register a
        // /companies. Un router.replace en este momento va al Stack que se
        // está desmontando y en iOS cerraba la app.
      } else {
        // Otro caso (por ejemplo, confirmación de correo activada)
        setError('Check your inbox to confirm your email before logging in.');
      }

    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={{ flex: 1 }}>
      <SiteHeader />

      <TermsModal
        visible={showTermsModal}
        onAccept={() => {
          setAcceptedTerms(true);
          setShowTermsModal(false);
        }}
        onCancel={() => setShowTermsModal(false)}
      />

      <AuthCard
        title="Create an account"
        subtitle="Join to save favorite companies and get notified about new auditions."
        footer={
          <Text style={[authStyles.bottomText, scale.bottomText]}>
            Already have an account?{' '}
            <Link href="/login">
              <Text style={authStyles.link}>Login</Text>
            </Link>
          </Text>
        }
      >
        <AuthTextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />
        <AuthTextInput
          ref={passwordRef}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          blurOnSubmit={false}
        />
        <AuthTextInput
          ref={confirmPasswordRef}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          accessibilityLabel="Confirm password"
          returnKeyType="go"
          onSubmitEditing={handleRegister}
        />

        <View style={styles.termsRow}>
          <Pressable
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="Accept terms and conditions"
          >
            {acceptedTerms && <View style={styles.checkedBox} />}
          </Pressable>
          <Text style={[styles.termsText, scale.body]}>
            By creating an account, you agree to our{' '}
            <Text style={authStyles.link} onPress={() => setShowTermsModal(true)}>
              Terms and Conditions
            </Text>
            .
          </Text>
        </View>

        {!!error && (
          <View style={authStyles.errorBox}>
            <Text style={[authStyles.errorText, scale.errorText]}>{error}</Text>
          </View>
        )}

        <AuthButton onPress={handleRegister} label="Create account" loading={loading} />
      </AuthCard>
    </View>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.ruleStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    borderColor: Colors.purple,
  },
  checkedBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.purple,
  },
  termsText: {
    flex: 1,
    color: Colors.textLightDark,
  },
});
