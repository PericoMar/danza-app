import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/services/supabase'; // Asegúrate que tienes este servicio creado
import { Link, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import Snackbar from '@/components/Snackbar';

export default function LoginScreen() {
  const [snackbar, setSnackbar] = useState<{
    message: string;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
  } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login failed', error.message);
        setSnackbar({
          message: 'Wrong credentials.',
          color: '#EF4444',
          iconName: 'close-circle-outline',
        });
      } else {
        router.push('/companies'); // Redirige a la pantalla de inicio después de iniciar sesión
      }

    } catch (err) {
      console.error(err);
      Alert.alert('Login error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3000}
          onClose={() => setSnackbar(null)}
        />
      )}
      <Text style={styles.title}>Welcome to danza.app</Text>

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

        <Pressable onPress={handleLogin} style={styles.button} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>

        <Text style={styles.bottomText}>
          Don't have an account? <Link href='/register' style={styles.linkText}>Sign up</Link>
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

