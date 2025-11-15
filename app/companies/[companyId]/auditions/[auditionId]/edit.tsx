// app/companies/[companyId]/auditions/[auditionId]/edit.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import AuditionForm from "@/components/auditions/AuditionForm";

export default function EditAuditionScreen() {
  const { companyId, auditionId } = useLocalSearchParams<{ companyId: string; auditionId: string }>();
  return <AuditionForm companyId={companyId} auditionId={auditionId} />;
}
