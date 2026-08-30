// providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";

type AuthCtx = {
  session: any | null;
  loading: boolean;
};

const AuthContext = createContext<AuthCtx>({ session: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

// Web resolves recovery/confirmation links on its own via the Supabase
// client's `detectSessionInUrl`. On native there's no browser location to
// read, so incoming myapp:// links (from ResetPasswordRequestForm's and
// register's redirectTo) are handled here: exchange the PKCE `code` for a
// session, then land on whatever screen the link pointed at.
function useAuthDeepLinks() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    const handleUrl = async (url: string) => {
      const { path, queryParams } = Linking.parse(url);
      const code = queryParams?.code;
      if (typeof code !== "string") return;

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && path) {
        router.replace(`/${path}` as any);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useAuthDeepLinks();

  useEffect(() => {
    let mounted = true;
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess ?? null);
    });
    boot();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
