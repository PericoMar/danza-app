import React from "react";
import { View, Text } from "react-native";
import { useCompanies } from "@/hooks/useCompanies";
import { SANS, INK_2, RULE, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import Kicker from "./Kicker";
import SectionTitle from "./SectionTitle";
import CompanyCell from "./CompanyCell";

interface CompaniesGridSectionProps {
  width: number;
  onGoCompanies: () => void;
}

function SkeletonCell() {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 200,
        borderRightWidth: 1,
        borderRightColor: RULE,
        borderBottomWidth: 1,
        borderBottomColor: RULE,
        padding: 36,
        paddingVertical: 40,
        gap: 8,
        opacity: 0.4,
        backgroundColor: Colors.purpleLight,
      }}
    />
  );
}

export default function CompaniesGridSection({ width, onGoCompanies }: CompaniesGridSectionProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);
  const { data, isLoading } = useCompanies();

  const companies = (data ?? []).slice(0, 8);

  if (!isLoading && companies.length === 0) return null;

  const cols = isMobile ? 2 : 4;
  const items = isLoading ? Array.from({ length: 8 }) : companies;
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }

  return (
    <View style={{ paddingHorizontal: pH, paddingVertical: isMobile ? 80 : 120 }}>
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
            <Kicker n="04" label="In the directory" />
            <SectionTitle>
              Trusted by{"\n"}
              <Text style={{ fontStyle: "italic" }}>leading companies.</Text>
            </SectionTitle>
          </View>
          {!isMobile && (
            <View style={{ maxWidth: 360, paddingBottom: 8 }}>
              <Text style={{ fontFamily: SANS, fontSize: 16, color: INK_2, lineHeight: 26 }}>
                From historic repertory houses to contemporary ensembles — Danza is where companies list and dancers discover.
              </Text>
            </View>
          )}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: RULE, borderLeftWidth: 1, borderLeftColor: RULE }}>
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row" }}>
              {isLoading
                ? row.map((_, ci) => <SkeletonCell key={ci} />)
                : (row as typeof companies).map((company, ci) => (
                    <CompanyCell key={company.id} company={company} isLastRow={ri === rows.length - 1} />
                  ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
