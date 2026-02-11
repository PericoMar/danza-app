// app/_layout.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { View, Pressable, Platform, Image, Text, useWindowDimensions } from "react-native";
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
import NewsletterModal from "@/components/modals/NewsletterModal";
import { RoleProvider } from "@/providers/RoleProvider";
import { supabase } from "@/services/supabase";
import { Colors } from "@/theme/colors";
import { SMALL_SCREEN_BREAKPOINT } from "@/constants/layout";

// ---------- AuthProvider (NO navega) ----------
type AuthCtx = { 
  session: any | null;
  loading: boolean
};
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
  if (pathname.startsWith("/companies") || pathname.startsWith("/insights") || pathname.startsWith("/home") || pathname.startsWith("/reset-password") || pathname.startsWith("/newsletter") || pathname.startsWith("/policies") ) return true;
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
    const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/reset-password";
    const isResetFlow = pathname.startsWith("/reset-password");
    if(!session) {
      if(!isPublicRoute(pathname)) router.replace("/login");
    } else if (session && !isResetFlow && (isAuthRoute || pathname === "/")) {
      // Don't redirect away from reset-password/update when user has session from recovery link
      router.replace("/companies");
    }
  }, [session, loading, rootNavState?.key, pathname]);

  return null;
}

// ---------- HeaderRight con contexto ----------
function RightHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_SCREEN_BREAKPOINT;

  // Wrapper común
  const containerStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginRight: 10,
  };

  if (isLoggedIn) {
    return (
      <View style={containerStyle}>
        <Pressable
          onPress={onOpenMenu}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 999,
          }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu-outline" size={28} color={Colors.text} />
        </Pressable>
      </View>
    );
  }

  // Invitado (no logueado)
  return (
    <View style={containerStyle}>
      {/* Home */}

      {/* COMENTARIO REVIEWS */}
      {/* <Link href="/home" asChild>
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: Colors.purpleDark,
            backgroundColor: Colors.purple,
            marginLeft: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel="Home"
        >
          <Ionicons name="home-outline" size={18} color={Colors.white} />
          {!isSmall && (
            <Text
              style={{
                marginLeft: 6,
                fontSize: 14,
                fontWeight: "500",
                color: Colors.white,
              }}
            >
              Home
            </Text>
          )}
        </Pressable>
      </Link> */}

      {/* Companies */}
      <Link href="/companies" asChild>
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: Colors.purpleSoft,
            backgroundColor: Colors.surfaceAlt,
            marginLeft: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel="Companies"
        >
          <Ionicons
            name="business-outline"
            size={18}
            color={Colors.purpleDark}
          />
          {!isSmall && (
            <Text
              style={{
                marginLeft: 6,
                fontSize: 14,
                fontWeight: "500",
                color: Colors.purpleDark,
              }}
            >
              Companies
            </Text>
          )}
        </Pressable>
      </Link>

      {/* Login / Register */}
      {isSmall ? (
        // Solo icono en pantallas pequeñas
        <Link href="/login" asChild>
          <Pressable
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 999,
              marginLeft: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Login"
          >
            <Ionicons name="person-outline" size={18} color={Colors.text} />
          </Pressable>
        </Link>
      ) : (
        // Texto en escritorio
        <>
          <Link href="/login" asChild>
            <Pressable
              style={{
                paddingHorizontal: 6,
                paddingVertical: 4,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.text,
                }}
              >
                Login
              </Text>
            </Pressable>
          </Link>
          <Link href="/register" asChild>
            <Pressable
              style={{
                paddingHorizontal: 6,
                paddingVertical: 4,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.text,
                }}
              >
                Register
              </Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
}

// ---------- AppShell: se REMONTA al cambiar sessionKey ----------
function AppShell() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {/* Newsletter popup (shows after 5-10s delay) */}
      <NewsletterModal />
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
