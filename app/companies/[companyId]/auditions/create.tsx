// app/companies/[companyId]/auditions/create.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import AuditionForm from "@/components/auditions/AuditionForm";

export default function CreateAuditionScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  return <AuditionForm companyId={companyId} />;
}
