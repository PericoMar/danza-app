import React, { useState } from "react";
import { View, Text } from "react-native";
import { useAuditions } from "@/hooks/useAuditions";
import { SANS, INK_2, RULE, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import Kicker from "./Kicker";
import SectionTitle from "./SectionTitle";
import LandingAuditionCard from "./LandingAuditionCard";

interface AuditionsTeaserSectionProps {
  width: number;
  onGoAuditions: () => void;
}

function isNewThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const auditionDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = (auditionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

function SkeletonCard() {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 260,
        backgroundColor: Colors.purpleLight,
        borderRadius: 4,
        padding: 28,
        gap: 14,
        minHeight: 180,
        opacity: 0.5,
      }}
    />
  );
}

export default function AuditionsTeaserSection({ width, onGoAuditions }: AuditionsTeaserSectionProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);
  const { data, loading } = useAuditions(6);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!loading && data.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: pH, paddingBottom: isMobile ? 80 : 120 }}>
      <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%", gap: 64 }}>
        <View
          style={{
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            gap: 32,
          }}
        >
          <View style={{ flex: 1 }}>
            <Kicker n="03" label="Open this week" />
            <SectionTitle>
              This week's{"\n"}
              <Text style={{ fontStyle: "italic" }}>new calls.</Text>
            </SectionTitle>
          </View>
          {!isMobile && (
            <View style={{ maxWidth: 360, paddingBottom: 8 }}>
              <Text style={{ fontFamily: SANS, fontSize: 16, color: INK_2, lineHeight: 26 }}>
                A sample of recent listings, updated daily across the directory. Favorites save instantly — no account required.
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={{ flex: 1, minWidth: isMobile ? "100%" : 260 }}>
                  <SkeletonCard />
                </View>
              ))
            : data.map((a) => (
                <View key={a.id} style={{ flex: 1, minWidth: isMobile ? "100%" : 260 }}>
                  <LandingAuditionCard
                    audition={a}
                    favorited={favorites.has(a.id)}
                    onToggleFav={() => toggleFav(a.id)}
                    isMobile={isMobile}
                    isNew={isNewThisWeek(a.audition_date)}
                  />
                </View>
              ))}
        </View>
      </View>
    </View>
  );
}
