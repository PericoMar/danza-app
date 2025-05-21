// app/_not-found.tsx
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export default function NotFound() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setIsLoading(false);
    };

    checkSession();
  }, []);

  if (isLoading || isLoggedIn === null) return null;

  return <Redirect href={isLoggedIn ? "/companies" : "/login"} />;
}
