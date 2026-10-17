import { useEffect, useRef, useState } from 'react';
import { TextInput, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import TermsModal from '@/components/modals/TermsModal';
import AuthTextInput from '@/components/auth/AuthTextInput';
import AuthButton from '@/components/auth/AuthButton';
import { authStyles } from '@/components/auth/authStyles';
import { useAuthScale } from '@/components/auth/useAuthScale';
import { Colors } from '@/theme/colors';
import { AccountType } from '@/types/resource';

interface SignUpFormProps {
  /** Goes into the auth user's metadata, which is where the sign-up trigger reads it from. */
  accountType: AccountType;
  initialEmail?: string;
  submitLabel?: string;
  /** Where the confirmation link should land on native (deep link). */
  emailRedirectPath?: string;
  /** The sign-up created a session straight away (email confirmation off). */
  onSignedUp?: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Email + password sign-up. The only place in the app that calls
 * `supabase.auth.signUp`, so the account type always travels with it: the
 * dancer flow mounts it on /register, the professional flow mounts it in the
 * middle of the onboarding, once they already have something to lose.
 */
export default function SignUpForm({
  accountType,
  initialEmail,
  submitLabel = 'Create account',
  emailRedirectPath = '/companies',
  onSignedUp,
}: SignUpFormProps) {
  const scale = useAuthScale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Pre-filled from a query param (e.g. coming from the newsletter form).
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleRegister = async () => {
    if (loading) return;
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
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
        options: {
          // Read by handle_new_auth_user() to set users.account_type.
          data: { account_type: accountType },
          // On native, confirming the email needs to deep-link back into the
          // app instead of Supabase's default web URL, otherwise confirmation
          // lands the user on the website with no session.
          ...(Platform.OS !== 'web'
            ? { emailRedirectTo: Linking.createURL(emailRedirectPath) }
            : {}),
        },
      });

      if (error) {
        setError(error.message || 'Registration failed. Please try again.');
      } else if (data?.user && !data.session) {
        // Email ya registrado pero no confirmado aún
        setError('Confirmation email sent, check your inbox.');
      } else if (data?.session) {
        // Registro + login automático (confirmación desactivada). No navegamos
        // desde aquí: el cambio de sesión remonta AppShell (key={sessionKey}) y
        // un router.replace en este momento va al Stack que se está
        // desmontando, que en iOS cerraba la app.
        onSignedUp?.();
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
    <>
      <TermsModal
        visible={showTermsModal}
        onAccept={() => {
          setAcceptedTerms(true);
          setShowTermsModal(false);
        }}
        onCancel={() => setShowTermsModal(false)}
      />

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

      <AuthButton onPress={handleRegister} label={submitLabel} loading={loading} />
    </>
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
