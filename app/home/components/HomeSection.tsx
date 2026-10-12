import React from "react";
import { View, Text, Platform } from "react-native";
import { SANS, MONO } from "@/theme/landing";
import { sectionHeaderStyles as s } from "./homeStyles";

/** Full-height section wrapper — scroll-snap aware on web. */
export function Page({
  children,
  pageH,
  bg = "#fff",
}: {
  children: React.ReactNode;
  pageH: number;
  bg?: string;
}) {
  return (
    <View
      style={[
        { minHeight: pageH, backgroundColor: bg, flex: 1, overflow: "visible" },
        Platform.OS === "web" && ({ scrollSnapAlign: "start" } as object),
      ]}
    >
      {children}
    </View>
  );
}

/** The "[0n] — label" row that opens every section. */
export function SectionHeader({
  mark,
  right,
  markColor,
  rightColor,
}: {
  mark: string;
  right?: string;
  markColor?: string;
  rightColor?: string;
}) {
  return (
    <View style={s.headerRow}>
      <Text style={[s.sectionMark, { fontFamily: MONO }, markColor ? { color: markColor } : null]}>
        {mark}
      </Text>
      {right ? (
        <Text style={[s.sectionRight, { fontFamily: SANS }, rightColor ? { color: rightColor } : null]}>
          {right}
        </Text>
      ) : null}
    </View>
  );
}
