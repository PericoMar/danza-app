import { useRef, useState } from 'react';
import { TextInput, View, Text, Alert } from 'react-native';
import { supabase } from '@/services/supabase'; // Asegúrate que tienes este servicio creado
import { Link } from 'expo-router';
import SiteHeader from '@/components/common/SiteHeader';
import AuthCard from '@/components/auth/AuthCard';
import AuthTextInput from '@/components/auth/AuthTextInput';
import AuthButton from '@/components/auth/AuthButton';
import { authStyles } from '@/components/auth/authStyles';
import { useAuthScale } from '@/components/auth/useAuthScale';
import { ToastTone } from '@/constants/toast';
import { useToast } from '@/providers/ToastProvider';

export default function LoginScreen() {
  const { showToast } = useToast();
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
        showToast({ message: 'Wrong credentials.', tone: ToastTone.ERROR });
        return;
      }
      // No router.replace here: AuthNavigator takes /login to /companies once
      // the session lands, and the toast lives above the navigator, so it stays.
      showToast({ message: 'Login successful.', tone: ToastTone.SUCCESS });
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
