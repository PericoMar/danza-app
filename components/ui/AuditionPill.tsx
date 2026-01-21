import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Audition } from "@/types/audition";
import { Colors } from "@/theme/colors";

type Props = {
  audition: Audition;
  statusColor?: string;
};

export function AuditionPill({ audition, statusColor }: Props) {
  // ---- formateo fecha corta DD.MM ----
  function formatShortDate(isoOrDate: string | null) {
    if (!isoOrDate) return "";
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}`;
  }

  // ---- DEADLINE ----
  let deadlineText: string | null = null;

  if (audition.deadline_mode === "asap") {
    deadlineText = "Deadline: ASAP";
  } else if (audition.deadline_mode === "always_open") {
    deadlineText = "Always open";
  } else if (
    audition.deadline_mode === "fixed_date" ||
    (!audition.deadline_mode && audition.deadline_date) // compat legacy
  ) {
    if (audition.deadline_date) {
      deadlineText = `Deadline: ${formatShortDate(audition.deadline_date)}`;
    }
  }

  // ---- AUDITION SCHEDULE ----
  let auditionText: string | null = null;

  if (audition.audition_schedule_mode === "to_be_arranged") {
    auditionText = "Audition: TBA";
  } else if (audition.audition_schedule_mode === "various_dates") {
    auditionText = "Multiple auditions";
  } else if (
    audition.audition_schedule_mode === "single_date" ||
    (!audition.audition_schedule_mode && audition.audition_date) // compat legacy
  ) {
    if (audition.audition_date) {
      auditionText = `Audition: ${formatShortDate(audition.audition_date)}`;
    }
  }

  const hasDeadlineInfo = !!deadlineText;
  const hasAuditionInfo = !!auditionText;
  const noInfo = !hasDeadlineInfo && !hasAuditionInfo;

  // Siempre mantenemos estructura: "Deadline: …" + "Audition: …"
  const deadlineDisplay = deadlineText ?? "Deadline: -";
  const auditionDisplay =
    auditionText ??
    (noInfo ? "Audition: - No date information given -" : "Audition: -");

  const showStatusDot = hasDeadlineInfo && hasAuditionInfo && !!statusColor;

  return (
    <View style={styles.auditionPill} accessibilityRole="text">
      {/* Emoji al principio */}
      <Text style={styles.auditionEar}>🩰</Text>

      {/* Centro: Deadline + Audition, poco espacio entre ambos */}
      <View style={styles.centerContent}>
        <Text style={styles.auditionText} numberOfLines={1}>
          <Text style={styles.label}>{deadlineDisplay}</Text>
        </Text>

        {/** separador pequeño solo si hay algo de audition */}
        {auditionDisplay && (
          <Text style={styles.separator} numberOfLines={1}>
            ·
          </Text>
        )}

        <Text style={styles.auditionText} numberOfLines={1}>
          <Text style={styles.label}>{auditionDisplay}</Text>
        </Text>
      </View>

      {/* Punto al final (oculto pero mantiene hueco si no aplica) */}
      <View
        style={[
          styles.statusDot,
          !showStatusDot && styles.statusDotHidden,
          showStatusDot && statusColor ? { backgroundColor: statusColor } : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  auditionPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.auditionBgColor,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  auditionEar: {
    fontSize: 14,
    marginRight: 4,
  },
  centerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  separator: {
    marginHorizontal: 8,
    fontSize: 13,
    color: "#4b5563",
  },
  auditionText: {
    fontSize: 13,
    color: "#111",
    flexShrink: 1,
  },
  label: {
    fontWeight: "600",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 12,
    borderStyle: "solid",
    backgroundColor: "transparent",
    marginLeft: 6,
  },
  statusDotHidden: {
    opacity: 0,
  },
});
