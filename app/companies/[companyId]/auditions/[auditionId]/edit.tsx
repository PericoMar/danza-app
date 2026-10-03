// app/companies/[companyId]/auditions/[auditionId]/edit.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import AuditionForm from "@/components/auditions/AuditionForm";
import RequireAdmin from "@/components/common/RequireAdmin";

export default function EditAuditionScreen() {
  const { companyId, auditionId } = useLocalSearchParams<{ companyId: string; auditionId: string }>();
  return (
    <RequireAdmin>
      <AuditionForm companyId={companyId} auditionId={auditionId} />
    </RequireAdmin>
  );
}
