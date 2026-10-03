// app/companies/[companyId]/auditions/create.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import AuditionForm from "@/components/auditions/AuditionForm";
import RequireAdmin from "@/components/common/RequireAdmin";

export default function CreateAuditionScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  return (
    <RequireAdmin>
      <AuditionForm companyId={companyId} />
    </RequireAdmin>
  );
}
