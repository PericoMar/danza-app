// utils/auditions.ts

import { Company } from "@/hooks/useCompanies";
import { Audition } from "@/types/audition";

export function hasOpenAudition(company: Company): boolean {

  return Boolean(company.auditions && company.auditions.length > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const auditions = Array.isArray(company.auditions) ? company.auditions : [];

  // OJO: aquí en tu comentario hablas de "deadline", pero en el código
  // estabas usando `audition_date`. Si la regla es ocultar cuando
  // *deadline* ya pasó, usa `deadline_date`:
  const nextAudition = auditions.find((a) => {
    if (!a?.audition_date) return true; // sin deadline -> la mostramos
    const d = new Date(a.audition_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() >= today.getTime();
  });

  return Boolean(nextAudition);
}

export function computeStatus(audition: Audition | null) {
  if (!audition) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = audition.deadline_date ? new Date(audition.deadline_date) : null;
  const auditionDate = audition.audition_date ? new Date(audition.audition_date) : null;

  if (deadline) deadline.setHours(0, 0, 0, 0);
  if (auditionDate) auditionDate.setHours(0, 0, 0, 0);

  if (!deadline && !auditionDate) return null;

  // 1) Before or same day as deadline -> green
  if (deadline && today.getTime() <= deadline.getTime()) {
    return {
      label: "Open call",
      textColor: "#047857", // emerald-700
      bgColor: "rgba(16, 185, 129, 0.14)",
    };
  }

  // 2) After deadline but before or same day as audition -> yellow
  if (
    deadline &&
    auditionDate &&
    today.getTime() > deadline.getTime() &&
    today.getTime() <= auditionDate.getTime()
  ) {
    return {
      label: "Post-deadline",
      textColor: "#aea00bff", // amber-800
      bgColor: "rgba(245, 158, 11, 0.16)",
    };
  }

  // 3) After audition -> red
  if (auditionDate && today.getTime() > auditionDate.getTime()) {
    return {
      label: "Past audition",
      textColor: "#B91C1C", // red-700
      bgColor: "rgba(248, 113, 113, 0.18)",
    };
  }

  // Fallback: only audition date in the future
  if (auditionDate && today.getTime() <= auditionDate.getTime()) {
    return {
      label: "Upcoming",
      textColor: "#0369A1", // sky-700
      bgColor: "rgba(56, 189, 248, 0.16)",
    };
  }

  return null;
}