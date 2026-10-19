import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import SiteHeader from "@/components/common/SiteHeader";
import ResetPasswordRequestForm from "@/components/auth/ResetPasswordRequestForm";
import AuthCard from "@/components/auth/AuthCard";
import { authStyles } from "@/components/auth/authStyles";
import { useAuthScale } from "@/components/auth/useAuthScale";

export default function ResetPasswordScreen() {
  const scale = useAuthScale();

  return (
    <View style={{ flex: 1 }}>
      <SiteHeader />

      <AuthCard
        title="Reset your password"
        subtitle="Enter your email and we'll send you a link to set a new password."
        footer={
          <Text style={[authStyles.bottomText, scale.bottomText]}>
            Back to <Link href="/login" style={authStyles.link}>Login</Link>
          </Text>
        }
      >
        <ResetPasswordRequestForm />
      </AuthCard>
    </View>
  );
}
