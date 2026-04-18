import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AuditionListItem } from "@/types/audition";
import { SERIF, SANS, MONO, INK_2, INK_3 } from "@/theme/landing";
import { Colors } from "@/theme/colors";

interface LandingAuditionCardProps {
  audition: AuditionListItem;
  favorited: boolean;
  onToggleFav: () => void;
  isMobile: boolean;
  isNew: boolean;
}

function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export default function LandingAuditionCard({ audition, favorited, onToggleFav, isNew }: LandingAuditionCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.purpleLight,
        borderRadius: 4,
        padding: 28,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
          {audition.location ?? "—"}
        </Text>
        {isNew ? (
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: Colors.purpleDark, fontWeight: "500" }}>
            ● New this week
          </Text>
        ) : (
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
            Open
          </Text>
        )}
      </View>

      <Text style={{ fontFamily: SERIF, fontWeight: "400", fontSize: 26, lineHeight: 28, color: Colors.text }}>
        {audition.company_name}
      </Text>

      <Text style={{ fontFamily: SANS, color: INK_2, fontSize: 14 }}>
        {audition.summary ?? "—"}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.07)",
        }}
      >
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
          Apply by {formatDeadline(audition.deadline_date ?? audition.audition_date)}
        </Text>
        <Pressable
          onPress={onToggleFav}
          aria-label="Save to favorites"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: favorited ? Colors.text : "rgba(255,255,255,0.6)",
            borderWidth: 1,
            borderColor: favorited ? Colors.text : "rgba(0,0,0,0.06)",
          }}
        >
          <Ionicons
            name={favorited ? "bookmark" : "bookmark-outline"}
            size={14}
            color={favorited ? "#fff" : Colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}
