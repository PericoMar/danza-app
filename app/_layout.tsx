// app/_layout.tsx
import React, { useEffect, useMemo } from "react";
import {
  Stack,
  useRouter,
  usePathname,
  useRootNavigationState,
} from "expo-router";
import Head from "expo-router/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MD3DarkTheme, Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NewsletterModal from "@/components/modals/NewsletterModal";
import { RoleProvider } from "@/providers/RoleProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

export { useAuth };

// ---------- Navegación por sesión (cuando Root está listo) ----------
function isPublicRoute(pathname: string) {
  // Ajusta a tus necesidades
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/companies") || pathname.startsWith("/insights") || pathname.startsWith("/home") || pathname.startsWith("/reset-password") || pathname.startsWith("/newsletter") || pathname.startsWith("/policies") || pathname.startsWith("/ads") || pathname.startsWith("/landing")) return true;
  return false;
}

// Follow the active branch of the navigation tree down to the leaf route. When a
// URL matches no file-based route, expo-router lands on "+not-found".
function activeRouteName(state: any): string | undefined {
  if (!state?.routes?.length) return undefined;
  const route = state.routes[state.index ?? state.routes.length - 1];
  return route?.state ? activeRouteName(route.state) : route?.name;
}

function AuthNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    if (loading) return;
    if (!rootNavState?.key) return;
    const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/reset-password";
    const isResetFlow = pathname.startsWith("/reset-password");
    const isNotFound = activeRouteName(rootNavState) === "+not-found";
    if(!session) {
      if (isNotFound) return; // unmatched URL: let the custom 404 screen render
      if(!isPublicRoute(pathname)) router.replace("/login");
    } else if (session && !isResetFlow && (isAuthRoute || pathname === "/")) {
      // Don't redirect away from reset-password/update when user has session from recovery link
      router.replace("/companies");
    }
  }, [session, loading, rootNavState?.key, pathname]);

  return null;
}

// ---------- AppShell: se REMONTA al cambiar sessionKey ----------
function AppShell() {
  return (
    <>
      <Head>
        <title>danza.app</title>
      </Head>

      {/* Every screen renders its own <SiteHeader/> — no global native header. */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Control de navegación por sesión */}
      <AuthNavigator />

      {/* Newsletter popup (shows after 5-10s delay) */}
      <NewsletterModal />
    </>
  );
}

// ---------- Root layout con remount por sesión ----------
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootContent() {
  const { session, loading } = useAuth();

  // Cambia al id del usuario o 'guest' -> fuerza remount de TODO al cambiar sesión
  const sessionKey = useMemo(() => session?.user?.id ?? "guest", [session?.user?.id]);

  // Nuevo QueryClient en cada sesión para evitar caché zombi
  const queryClient = useMemo(() => new QueryClient(), [sessionKey]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* RoleProvider dentro, se reinicia con sessionKey */}
      <RoleProvider key={sessionKey}>
        <PaperProvider theme={MD3DarkTheme}>
          {/* Evita flicker: si quieres, puedes poner un loader mientras `loading` */}
          {!loading && <AppShell key={sessionKey} />}
        </PaperProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}
