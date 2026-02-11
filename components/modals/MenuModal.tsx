// components/modals/MenuModal.tsx
import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Portal } from "react-native-paper";
import { supabase } from "@/services/supabase";
import { useRole } from "@/providers/RoleProvider";
import { hardCleanup } from "@/utils/cleanup";

interface MenuModalProps {
  isVisible: boolean;
  onClose?: () => void;
}

export default function MenuModal({ isVisible, onClose }: MenuModalProps) {
  const router = useRouter();
  const { isAdmin, loading } = useRole();

  // Close the menu on viewport resize (orientation/resize on web)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", () => {
      onClose?.();
    });
    return () => {
      // @ts-ignore RN web + native both expose remove()
      subscription?.remove?.();
    };
  }, []);

  // donde haces logout
  const handleLogout = async () => {
    try {
      // 1) Sign out (si hay latencias, un pequeño "guard" de timeout evita quedarse colgado)
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('signout-timeout')), 5000))
      ]);
    } catch (e) {
      console.warn('signOut error/timeout', (e as Error).message);
    } finally {
      // 2) Limpieza agresiva
      await hardCleanup();
      // 3) NO navegues aquí si ya navegas por el listener de sesión
      // router.replace('/login'); 
      onClose?.();
    }
  };


  if (!isVisible || loading) return null;

  return (
    <Portal>
      {/* Backdrop that closes the menu when tapped */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => onClose?.()}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
      />

      {/* Floating popover anchored to the top-right, below header */}
      <View
        pointerEvents="box-none"
        style={styles.anchorContainer}
      >
        <View style={[styles.popover, Platform.OS === "web" && styles.popoverWeb]}>
          {/* COMENTARIO REVIEWS */}
          {/* <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/home"); }}
          >
            <Ionicons name="home-outline" size={18} color="#333" />
            <Text style={styles.text}>Home</Text>
          </Pressable> */}
          <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/companies"); }}
          >
            <Ionicons name="business-outline" size={18} color="#333" />
            <Text style={styles.text}>Companies</Text>
          </Pressable>

          {isAdmin && (
            <Pressable
              style={styles.item}
              onPress={() => { onClose?.(); router.push("/companies/add"); }}
            >
              <Ionicons name="add-outline" size={18} color="#333" />
              <Text style={styles.text}>Add Company</Text>
            </Pressable>
          )}

          {/* <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/profile"); }}
          >
            <Ionicons name="person-outline" size={18} color="#333" />
            <Text style={styles.text}>My Profile</Text>
          </Pressable> */}

          {/* COMENTARIO REVIEWS */}
          {/* <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/my-reviews"); }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#333" />
            <Text style={styles.text}>My Reviews</Text>
          </Pressable> */}

          <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/newsletter"); }}
          >
            <Ionicons name="mail-outline" size={18} color="#333" />
            <Text style={styles.text}>Newsletter</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/support"); }}
          >
            <Ionicons name="bug-outline" size={18} color="#333" />
            <Text style={styles.text}>Report a Bug</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => { onClose?.(); router.push("/policies" as any); }}
          >
            <Ionicons name="document-text-outline" size={18} color="#333" />
            <Text style={styles.text}>Legal & Policies</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              // Open on another tab the instagram page
              window.open("https://www.instagram.com/danza_app/", "_blank");
             }}
          >
            <Ionicons name="logo-instagram" size={20} color="#333" />
            <Text style={styles.text}>Instagram</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#333" />
            <Text style={styles.text}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </Portal>
  );
}

const HEADER_OFFSET = Platform.select({ web: 50, default: 60 });

const styles = StyleSheet.create({
  // Container that anchors the popover in the top-right corner
  anchorContainer: {
    position: "absolute",
    top: HEADER_OFFSET,
    right: 10,
    left: 0,
    bottom: 0,
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  popover: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    minWidth: 180,

    // Native shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  // Web-only shadow via CSS
  popoverWeb: {
    boxShadow: "0 4px 24px rgba(0,0,0,0.13), 0 1.5px 6px rgba(0,0,0,0.08)",
    shadowColor: undefined,
    shadowOpacity: undefined,
    shadowRadius: undefined,
    elevation: undefined,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 15,
    color: "#333",
  },
});
