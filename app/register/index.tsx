import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/services/supabase';
import { Link, router } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
  
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
  
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
  
    try {
      setLoading(true);
  
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (error) {
        setError(error.message || 'Registration failed. Please try again.');
      } else if (data?.user && !data.session) {
        // Email ya registrado pero no confirmado aún
        setError('Confirmation email sent, check your inbox.');
      } else if (data?.session) {
        // Registro + login automático (si confirmación desactivada)
        router.replace('/companies');
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
    <View style={styles.container}>
      <Text style={styles.title}>Create an account</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable onPress={handleRegister} style={styles.button} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </Pressable>

        <Text style={styles.bottomText}>
          Already have an account?  
          <Link href="/login">
            <Text style={styles.linkText}> Login</Text>
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
