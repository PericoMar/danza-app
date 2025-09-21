// app/_layout.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { View, Pressable, Platform, Image, Text } from "react-native";
import {
  Stack,
  Link,
  useRouter,
  usePathname,
  useRootNavigationState,
} from "expo-router";
import Head from "expo-router/head";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MD3DarkTheme, Provider as PaperProvider, Portal } from "react-native-paper";
import MenuModal from "@/components/modals/MenuModal";
import { RoleProvider } from "@/providers/RoleProvider";
import { supabase } from "@/services/supabase"; // <- ideal: un único archivo cross-platform

// ---------- AuthProvider (NO navega) ----------
type AuthCtx = { session: any | null; loading: boolean };
const AuthContext = createContext<AuthCtx>({ session: null, loading: true });
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

// ---------- Navegación por sesión (cuando Root está listo) ----------
function isPublicRoute(pathname: string) {
  // Ajusta a tus necesidades
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/companies") || pathname.startsWith("/reviews")) return true;
  return false;
}

function AuthNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    if (loading) return;
    if (!rootNavState?.key) return;

    const isAuthRoute = pathname === "/login" || pathname === "/register";
    if(!session) {
      if(!isPublicRoute(pathname)) router.replace("/login");
    } else if (!session && !isAuthRoute) {
      router.replace("/login");
    } else if (session && (isAuthRoute || pathname === "/")) {
      router.replace("/companies");
    }
  }, [session, loading, rootNavState?.key, pathname]);

  return null;
}

// ---------- HeaderRight con contexto ----------
function RightHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { session } = useAuth();
  const isLoggedIn = !!session;

  return (
    <View style={{ flexDirection: "row", gap: 8, marginRight: 10 }}>
      {isLoggedIn ? (
        <Pressable onPress={onOpenMenu}>
          <Ionicons
            name="menu-outline"
            size={28}
            color="black"
            style={Platform.OS === "web" ? { cursor: "pointer" } : undefined}
          />
        </Pressable>
      ) : (
        <>
          <Link
            href="/login"
            style={{
              fontSize: 14,
              color: "black",
              ...(Platform.OS === "web" && { cursor: "pointer" }),
            }}
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{
              fontSize: 14,
              color: "black",
              ...(Platform.OS === "web" && { cursor: "pointer" }),
            }}
          >
            Register
          </Link>
        </>
      )}
    </View>
  );
}

// ---------- AppShell: se REMONTA al cambiar sessionKey ----------
function AppShell() {
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const customDarkTheme = {
    ...MD3DarkTheme,
    colors: { ...MD3DarkTheme.colors },
  };

  return (
    <>
      <Head>
        <title>danza.app</title>
      </Head>

      <Stack
        screenOptions={{
          headerTitle: () => (
            <Link href="/companies" style={{ textDecorationLine: "none" }} asChild>
              <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Image
                  source={require("@/assets/images/favicon.png")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "black" }}>
                  danza.app
                </Text>
              </Pressable>
            </Link>
          ),
          headerRight: () => <RightHeader onOpenMenu={() => setIsModalOpen(true)} />,
        }}
      />

      {/* Control de navegación por sesión */}
      <AuthNavigator />

      {/* Floating menu (via Portal) */}
      <MenuModal isVisible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

// ---------- Root layout con remount por sesión ----------
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootContent />
    </AuthProvider>
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
          <Portal.Host>
            {/* Evita flicker: si quieres, puedes poner un loader mientras `loading` */}
            {!loading && <AppShell key={sessionKey} />}
          </Portal.Host>
        </PaperProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}
