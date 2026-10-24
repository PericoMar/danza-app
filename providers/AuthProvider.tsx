// providers/AuthProvider.tsx
import React, { createContext, startTransition, useContext, useEffect, useState } from "react";
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

// The root layout renders nothing (and on native keeps the splash screen up)
// while `loading` is true, so boot must always end. If getSession() hangs —
// dead network during a token refresh, a stuck storage lock — stop waiting
// after this long and render as a guest; onAuthStateChange still delivers
// the session if it shows up later.
const BOOT_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useAuthDeepLinks();

  useEffect(() => {
    let mounted = true;
    // The session found at boot goes in as a transition: on web a public page
    // is already on screen, prerendered, and React may still be hydrating
    // parts of it. An urgent update there makes React throw that HTML away
    // and render the part again on the client (error #421); a transition
    // waits for hydration. Later changes (log in, log out) stay urgent, so a
    // screen that navigates right after signing in never runs ahead of them.
    const applyBootSession = (sess: any | null) => {
      startTransition(() => setSession(sess));
    };
    const finishBoot = () => {
      if (mounted) startTransition(() => setLoading(false));
    };
    const bootTimeout = setTimeout(() => {
      console.warn(`[AuthProvider] getSession() still pending after ${BOOT_TIMEOUT_MS}ms, continuing without a session`);
      finishBoot();
    }, BOOT_TIMEOUT_MS);

    async function boot() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("[AuthProvider] getSession() error:", error.message);
        if (!mounted) return;
        applyBootSession(data.session ?? null);
      } catch (err) {
        console.error("[AuthProvider] getSession() threw:", err);
      } finally {
        clearTimeout(bootTimeout);
        finishBoot();
      }
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      if (event === "INITIAL_SESSION") applyBootSession(sess ?? null);
      else setSession(sess ?? null);
    });
    boot();
    return () => {
      mounted = false;
      clearTimeout(bootTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
