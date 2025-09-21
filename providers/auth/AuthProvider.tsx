// auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';

type AuthCtx = { session: any | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
      // Ruta inicial según sesión
      if (data.session) router.replace('/companies');
      else router.replace('/login');
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      // Navegación reactiva
      if (sess) router.replace('/companies');
      else router.replace('/login');
    });

    boot();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={{ session, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
