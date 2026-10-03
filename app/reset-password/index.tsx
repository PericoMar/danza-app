import React, { useState } from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import Snackbar from "@/components/Snackbar";
import type { SnackbarState } from "@/types/ui";
import SiteHeader from "@/components/common/SiteHeader";
import ResetPasswordRequestForm from "@/components/auth/ResetPasswordRequestForm";
import AuthCard from "@/components/auth/AuthCard";
import { authStyles } from "@/components/auth/authStyles";
import { useAuthScale } from "@/components/auth/useAuthScale";

export default function ResetPasswordScreen() {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const scale = useAuthScale();

  return (
    <View style={{ flex: 1 }}>
      <SiteHeader />

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3500}
          onClose={() => setSnackbar(null)}
        />
      )}

      <AuthCard
        title="Reset your password"
        subtitle="Enter your email and we'll send you a link to set a new password."
        footer={
          <Text style={[authStyles.bottomText, scale.bottomText]}>
            Back to <Link href="/login" style={authStyles.link}>Login</Link>
          </Text>
        }
      >
        <ResetPasswordRequestForm onSnackbar={setSnackbar} />
      </AuthCard>
    </View>
  );
}
