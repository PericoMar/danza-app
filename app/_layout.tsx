// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  Stack,
  useRouter,
  usePathname,
  useRootNavigationState,
} from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MD3DarkTheme, Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NewsletterModal from "@/components/modals/NewsletterModal";
import RouteSeo from "@/components/common/RouteSeo";
import { RoleProvider } from "@/providers/RoleProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/theme/colors";
import { PUBLIC_EXACT_ROUTES, PUBLIC_ROUTE_PREFIXES } from "@/constants/routes";

export { useAuth };

// ---------- Navegación por sesión (cuando Root está listo) ----------
function isPublicRoute(pathname: string) {
  return (
    (PUBLIC_EXACT_ROUTES as readonly string[]).includes(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
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

// ---------- AppShell: mounts once, stays mounted across sessions ----------
function AppShell() {
  return (
    <>
      {/* Every screen renders its own <SiteHeader/> — no global native header. */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Control de navegación por sesión */}
      <AuthNavigator />

      {/* Newsletter popup (shows after 5-10s delay) */}
      <NewsletterModal />
    </>
  );
}

// ---------- Loader mientras AuthProvider resuelve la sesión ----------
// Only visible on web: on native the splash screen stays up until <Stack>
// mounts. The spinner waits a beat so the usual instant boot doesn't flicker.
function BootLoader() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSpinner(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.bootLoader}>
      {showSpinner && <ActivityIndicator color={Colors.text} />}
    </View>
  );
}

// ---------- Root layout ----------
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
  const userId = session?.user?.id ?? null;

  // One QueryClient for the app's whole life. This used to be rebuilt per
  // session, with `key={sessionKey}` remounting everything below it, so no
  // user could ever be served the previous one's cache. That also tore down
  // and rebuilt the root <Stack>, and in the gap between the two navigators
  // `router.setParams`/`replace` throw "Attempted to navigate before mounting
  // the Root Layout component" — an uncaught error inside a React commit, so
  // React unmounts the root and the app sits on a blank screen until it is
  // restarted. Emptying the cache keeps the guarantee without the remount.
  const [queryClient] = useState(() => new QueryClient());
  useEffect(() => {
    queryClient.clear();
  }, [userId, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <PaperProvider theme={MD3DarkTheme}>
          {/* Outside the session gate on purpose: during the static web export
              the session never resolves, so anything rendered only when
              `!loading` is absent from every prerendered page — which is how
              the whole site shipped with an empty <title>. */}
          <RouteSeo />
          {loading ? <BootLoader /> : <AppShell />}
        </PaperProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  bootLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },
});
