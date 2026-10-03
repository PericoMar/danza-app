import { useRef, useState } from 'react';
import { TextInput, View, Text, Alert } from 'react-native';
import { supabase } from '@/services/supabase'; // Asegúrate que tienes este servicio creado
import { Link } from 'expo-router';
import Snackbar from '@/components/Snackbar';
import { SnackbarState } from '@/types/ui';
import SiteHeader from '@/components/common/SiteHeader';
import AuthCard from '@/components/auth/AuthCard';
import AuthTextInput from '@/components/auth/AuthTextInput';
import AuthButton from '@/components/auth/AuthButton';
import { authStyles } from '@/components/auth/authStyles';
import { useAuthScale } from '@/components/auth/useAuthScale';

export default function LoginScreen() {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const scale = useAuthScale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setSnackbar({ message: 'Wrong credentials.', color: '#EF4444', iconName: 'close-circle-outline' });
        return;
      }
      setSnackbar({ message: 'Login successful.', color: '#4CAF50', iconName: 'checkmark-circle-outline' });
      // No router.replace aquí
    } catch (err) {
      console.error(err);
      Alert.alert('Login error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SiteHeader />

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3000}
          onClose={() => setSnackbar(null)}
        />
      )}

      <AuthCard
        title="Welcome back"
        subtitle="Sign in to keep track of your favorite companies and auditions."
        footer={
          <>
            <Text style={[authStyles.bottomText, scale.bottomText]}>
              Don't have an account? <Link href="/register" style={authStyles.link}>Sign up</Link>
            </Text>
            <Text style={[authStyles.bottomText, scale.bottomText]}>
              <Link href="/reset-password" style={authStyles.link}>Forgot your password?</Link>
            </Text>
          </>
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
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <AuthButton onPress={handleLogin} label="Continue" loading={loading} />
      </AuthCard>
    </View>
  );
}
