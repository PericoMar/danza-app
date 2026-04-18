import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import type { Company } from "@/hooks/useCompanies";
import { SERIF, MONO, INK_3, RULE } from "@/theme/landing";
import { Colors } from "@/theme/colors";

interface CompanyCellProps {
  company: Company;
  isLastRow: boolean;
}

export default function CompanyCell({ company }: CompanyCellProps) {
  const [hovered, setHovered] = useState(false);
  const loc = company.location ?? company.country ?? "—";

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
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
        backgroundColor: hovered ? Colors.purpleLight : "transparent",
      }}
    >
      <Text style={{ fontFamily: SERIF, fontWeight: "500", fontSize: 20, lineHeight: 22, color: Colors.text }}>
        {company.name}
      </Text>
      <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
        {loc}
      </Text>
    </Pressable>
  );
}
