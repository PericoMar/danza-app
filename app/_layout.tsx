// app/_layout.tsx
import { useRouter, Stack, Link } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Pressable, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import MenuModal from '@/components/MenuModal';
import { supabase } from '@/services/supabase';
import { Image, Text } from 'react-native';
import Head from 'expo-router/head';

const queryClient = new QueryClient();

export default function Layout() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };

    checkSession();

    // Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>danza.app</title>
      </Head>

      <Stack
        screenOptions={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>danza.app</Text>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8, marginRight: 10 }}>
              {isLoggedIn ? (
                <Pressable onPress={() => setIsModalOpen(true)}>
                  <Ionicons
                    name="menu-outline"
                    size={28}
                    color="black"
                    style={Platform.OS === 'web' ? { cursor: 'pointer' } : undefined}
                  />
                </Pressable>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{ fontSize: 14, color: 'black', ...(Platform.OS === 'web' && { cursor: 'pointer' }) }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    style={{ fontSize: 14, color: 'black', ...(Platform.OS === 'web' && { cursor: 'pointer' }) }}
                  >
                    Register
                  </Link>
                </>
              )}
            </View>
          ),
        }}
      />



      {/* Sidebar animado */}
      <MenuModal
        isVisible={isModalOpen}
        onClose={() => setIsModalOpen(false)} />
    </QueryClientProvider >
  );
}
