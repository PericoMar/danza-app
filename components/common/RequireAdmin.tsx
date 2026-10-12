// components/common/RequireAdmin.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useRole } from "@/providers/RoleProvider";
import SiteHeader from "@/components/common/SiteHeader";

/**
 * Gate for admin-only management routes. Redirects non-admins to /companies
 * once the role has resolved; shows a loader in the meantime so a real admin
 * isn't bounced while `is_admin` is still loading.
 */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/companies");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <>
        <SiteHeader />
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
