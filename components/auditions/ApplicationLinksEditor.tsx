// components/auditions/ApplicationLinksEditor.tsx
// Editor de los enlaces de inscripción de una audición: dónde se apunta el
// bailarín (formulario, subida de vídeo…). Se muestran como botones en la
// ficha pública, en este orden; el primero es el destacado.
import React from "react";
import {
  APPLICATION_LINK_LABEL_MAX_CHARS,
  APPLICATION_LINK_LABEL_PRESETS,
  APPLICATION_LINK_URL_MAX_CHARS,
} from "@/constants/auditions";
import { ApplicationLinkDraft, FormErrors, emptyApplicationLink } from "@/utils/auditionForm";
import LabeledListEditor from "@/components/auditions/LabeledListEditor";

type Props = {
  links: ApplicationLinkDraft[];
  onChange: (links: ApplicationLinkDraft[]) => void;
  errors: FormErrors;
};

export default function ApplicationLinksEditor({ links, onChange, errors }: Props) {
  return (
    <LabeledListEditor
      title="Application links (optional)"
      hint="Where dancers apply: a form, a video upload, a registration page… They show up as buttons on the audition, in this order, and the first one stands out. Only while the call is open. Not the Website URL above, which stays as the information page."
      field="url"
      rows={links}
      onChange={onChange}
      create={emptyApplicationLink}
      errors={errors}
      itemName="link"
      itemTitle={(i) => (i === 0 ? "Link 1 · main" : `Link ${i + 1}`)}
      addLabel="+ Add application link"
      valueInput={{
        label: "URL",
        placeholder: "https://forms.company.com/apply",
        maxLength: APPLICATION_LINK_URL_MAX_CHARS,
        keyboardType: "url",
      }}
      labelInput={{
        label: "Button text (optional)",
        placeholder: "Apply online",
        maxLength: APPLICATION_LINK_LABEL_MAX_CHARS,
        emptyHint: "Empty: “Apply”, or the site's name when there are several links.",
        presets: APPLICATION_LINK_LABEL_PRESETS,
        presetName: "Button text",
      }}
    />
  );
}
