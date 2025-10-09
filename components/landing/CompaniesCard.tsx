// components/landing/CompaniesCard.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useIncrementingCounter } from "@/hooks/useIncrementingCounter";
import { TYPO, SPACING } from "@/theme/tokens";
import PillButton from "../common/PillButton";
import { Row, MutedText } from "../common/Primitives";
import { Colors } from "@/theme/colors";
import { UpTrendIcon } from "./ui/UpTrendIcon";
import AIHighlight from "./AiHighlight";

type CounterConfig = { base: number; periodHours: number; startedAtISO: string; label?: string };

type Props = {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    counter: CounterConfig;
    onExplore: () => void;
    minHeight?: number;
};

export default function CompaniesCard({
    icon = "business-outline",
    title,
    description,
    counter,
    onExplore,
    minHeight = 400,
}: Props) {
    const value = useIncrementingCounter(counter.base, counter.periodHours, counter.startedAtISO);

    return (
        <View
            style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: SPACING.lg,
                borderWidth: 1,
                borderColor: Colors.purpleSoft,
                // soft shadow
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 8 },
                elevation: Platform.select({ android: 3, default: 0 }),
                flex: 1,
                maxWidth: 530,
                minHeight: minHeight,
                boxSizing: "border-box",
            }}
        >
            {/* Header with bigger icon */}
            <Row>
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        backgroundColor: Colors.purple,
                        borderWidth: 1,
                        borderColor: Colors.purpleDark,
                    }}
                >
                    <Ionicons name={icon} size={26} color="#FFFFFF" />
                </View>
                <Text style={{ color: Colors.text, ...TYPO.h2, fontSize: 24 }}>{title}</Text>
            </Row>

            {description ? (
                <Text style={{ color: "#5B5B62", marginTop: 6, ...TYPO.body }}>{description}</Text>
            ) : null}

            {/* Counter + animated chevron */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md, alignItems: "center", gap: SPACING.lg }} >
                {/* Izquierda: Counter + chevron */}
                <View style={{ flex: 1 }}>
                    <Row gap={10} >
                        <UpTrendIcon />
                        <Text style={{ color: Colors.text, fontSize: 36, fontWeight: "900" }}>
                            +{value.toLocaleString()}
                        </Text>
                    </Row>
                    {counter.label ? <MutedText>{counter.label}</MutedText> : null}
                </View>

                {/* Derecha: Panel AI */}
                <AIHighlight />
            </View>

            <View style={{ alignSelf: 'flex-end', marginTop: 'auto' }}>
                <PillButton label="Compare companies with AI" onPress={onExplore} variant="black" />
            </View>
        </View>
    );
}
