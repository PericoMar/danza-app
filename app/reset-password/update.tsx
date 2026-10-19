import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { Colors } from "@/theme/colors";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/services/supabase";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import SiteHeader from "@/components/common/SiteHeader";
import AuthCard from "@/components/auth/AuthCard";
import { authStyles } from "@/components/auth/authStyles";
import { useAuthScale } from "@/components/auth/useAuthScale";

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const scale = useAuthScale();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(!!data.session);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SiteHeader />

      <AuthCard
        title="Set a new password"
        subtitle={
          hasSession === false
            ? "This link is not valid anymore or your session is missing. Please request a new reset email."
            : undefined
        }
        footer={
          hasSession === false ? (
            <Text style={[authStyles.bottomText, scale.bottomText]}>
              Go to <Link href="/reset-password" style={authStyles.link}>Reset password</Link>
            </Text>
          ) : undefined
        }
      >
        {hasSession === null ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator color={Colors.text} />
          </View>
        ) : hasSession ? (
          <UpdatePasswordForm onSuccess={() => router.replace("/login")} />
        ) : null}
      </AuthCard>
    </View>
  );
}
