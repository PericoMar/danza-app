// components/auditions/AuditionCard.tsx
import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import AuditionDeleteButton from "@/components/auditions/AuditionDeleteButton";
import { Audition, HeightReq } from "@/types/audition";

type Props = {
  audition: Audition;
  heights?: HeightReq[];
  isCurrent?: boolean;
  onEdit?: (audition: Audition) => void;
  onDeleted?: (auditionId: string) => void;
  onDeleteError?: (message: string) => void;
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return d ?? "—";
  }
}

function heightsToLine(heights?: HeightReq[]) {
  if (!heights || heights.length === 0) return "—";
  const short = heights
    .map((h) => {
      const tag = h.gender === "male" ? "♂" : h.gender === "female" ? "♀" : "∀";
      const min = h.min_height_cm ?? "";
      const max = h.max_height_cm ?? "";
      if (min && max) return `${tag}:${min}-${max}cm`;
      if (min && !max) return `${tag}≥${min}cm`;
      if (!min && max) return `${tag}≤${max}cm`;
      return `${tag} any height`;
    })
    .join("  ");
  return short;
}

export default function AuditionCard({
  audition,
  heights,
  isCurrent,
  onEdit,
  onDeleted,
  onDeleteError,
}: Props) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        gap: 6,
      }}
      accessible
      accessibilityLabel={`Audición ${audition.summary || ""}`}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>
          {audition.summary || "Sin título"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {isCurrent ? (
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#16a34a",
              }}
              accessibilityLabel="Audición vigente"
            >
              <Text style={{ fontSize: 12, color: "#16a34a" }}>Vigente</Text>
            </View>
          ) : null}

          {/* Botón eliminar totalmente encapsulado */}
          <AuditionDeleteButton
            audition={audition}
            onDeleted={onDeleted}
            onError={onDeleteError}
          />
        </View>
      </View>

      <Text style={{ opacity: 0.85 }}>📍 {audition.location || "—"}</Text>

      <Text style={{ opacity: 0.85 }}>
        🎭 Audición: {formatDate(audition.audition_date)}   ·   ⏳ Deadline: {formatDate(audition.deadline_date)}
      </Text>

      <Text style={{ opacity: 0.85 }}>📧 {audition.email || "—"}</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
        <Text style={{ opacity: 0.85 }}>📏</Text>
        <Text style={{ opacity: 0.85 }}>{heightsToLine(heights)}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
        {audition.website_url ? (
          <Pressable onPress={() => Linking.openURL(audition.website_url!)} accessibilityRole="link">
            <Text style={{ textDecorationLine: "underline" }}>Abrir web</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => onEdit?.(audition)} accessibilityRole="button">
          <Text style={{ fontWeight: "600" }}>Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}
