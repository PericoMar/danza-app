// components/auditions/AuditionEmailsEditor.tsx
// Editor de los emails de contacto de una audición, cada uno con un texto
// opcional que dice para qué es. Se muestran en la ficha pública, en este orden.
import React from "react";
import {
  AUDITION_EMAIL_LABEL_MAX_CHARS,
  AUDITION_EMAIL_LABEL_PRESETS,
  AUDITION_EMAIL_MAX_CHARS,
} from "@/constants/auditions";
import { EmailDraft, FormErrors, emptyEmail } from "@/utils/auditionForm";
import LabeledListEditor from "@/components/auditions/LabeledListEditor";

type Props = {
  emails: EmailDraft[];
  onChange: (emails: EmailDraft[]) => void;
  errors: FormErrors;
};

export default function AuditionEmailsEditor({ emails, onChange, errors }: Props) {
  return (
    <LabeledListEditor
      title="Contact emails (optional)"
      hint="Addresses dancers can write to, in this order. When there are several, say what each one is for (applications, questions, women, men…)."
      field="email"
      rows={emails}
      onChange={onChange}
      create={emptyEmail}
      errors={errors}
      itemName="email"
      itemTitle={(i) => `Email ${i + 1}`}
      addLabel="+ Add contact email"
      valueInput={{
        label: "Email",
        placeholder: "casting@company.com",
        maxLength: AUDITION_EMAIL_MAX_CHARS,
        keyboardType: "email-address",
      }}
      labelInput={{
        label: "What it's for (optional)",
        placeholder: "Applications",
        maxLength: AUDITION_EMAIL_LABEL_MAX_CHARS,
        emptyHint: "Empty: just the address.",
        presets: AUDITION_EMAIL_LABEL_PRESETS,
        presetName: "What it's for",
      }}
    />
  );
}
