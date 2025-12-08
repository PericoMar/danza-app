// components/landing/AuditionsCard.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, Animated, Platform, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { TYPO, SPACING } from "@/theme/tokens";
import { Colors } from "@/theme/colors";
import { Row, MutedText, Dot, Spacer } from "../common/Primitives";
import PillButton from "../common/PillButton";
import type { AuditionListItem } from "@/types/audition";
import { useAuditions } from "@/hooks/useAuditions";

type Props = {
    title?: string;
    description?: string;
    /** If you pass auditions, the component will render them; if not, it will use useAuditions() */
    auditions?: AuditionListItem[];
    limit?: number;
    onSeeAll: () => void;
    minHeight?: number;
};

export default function AuditionsCard({
    title = "Upcoming auditions",
    description = "Post 1 review to unlock early access. Stay up-to-date with fresh audition listings.",
    auditions,
    limit = 2,
    onSeeAll,
    minHeight = 400,
}: Props) {
    // Fetch from DB only if not provided
    const { data, loading } = useAuditions(!auditions ? limit : 0);
    const finalAuditions = useMemo(() => auditions ?? data, [auditions, data]);

    // Staggered entrance animation for list items
    const anims = useRef<Animated.Value[]>([]).current;
    if (anims.length !== finalAuditions.length) {
        anims.length = 0;
        for (let i = 0; i < finalAuditions.length; i++) {
            anims.push(new Animated.Value(0));
        }
    }

    useEffect(() => {
        if (!finalAuditions.length) return;
        Animated.stagger(
            70,
            anims.map((a) =>
                Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: true })
            )
        ).start();
    }, [finalAuditions, anims]);

    return (
        <View
            style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: SPACING.lg,
                borderWidth: 1,
                borderColor: Colors.purpleSoft,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 8 },
                elevation: Platform.select({ android: 3, default: 0 }),
                flex: 1,
                justifyContent: "flex-start",
                flexDirection: "column",
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
                    <Ionicons name="calendar-outline" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ color: Colors.text, ...TYPO.h2, fontSize: 24 }}>{title}</Text>
            </Row>

            {/* Marketing / early access copy with animated unlocking lock */}
            <View style={{ marginTop: 8 }}>
                <Row gap={8}>
                    <Text style={{ color: "#5B5B62", ...TYPO.body }}>{description}</Text>
                </Row>
            </View>

            {/* List */}
            <View style={{ marginVertical: SPACING.md, gap: SPACING.xs }}>
                {loading && finalAuditions.length === 0 ? (
                    <MutedText>Loading auditions…</MutedText>
                ) : finalAuditions.length === 0 ? (
                    <MutedText>No upcoming auditions found.</MutedText>
                ) : (
                    finalAuditions.map((audition, idx) => {
                        const opacity = anims[idx]?.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) ?? 1;
                        const translateY = anims[idx]?.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) ?? 0;

                        return (
                            <Animated.View
                                key={audition.id}
                                style={{ opacity, transform: [{ translateY }] }}
                            >
                                <Pressable
                                    onPress={() => audition.website_url && Linking.openURL(audition.website_url)}
                                    android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                                    style={{
                                        paddingVertical: 2,
                                        borderRadius: 12,
                                        flex: 1,
                                        flexDirection: "row",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    <Ionicons name="pin-outline" size={18} color={Colors.purpleSoft} />
                                    <Text style={{ color: Colors.textMuted, fontWeight: "700" }}>{audition.company_name}</Text>
                                    <Dot />
                                    <MutedText>{audition.location}</MutedText>
                                    <Spacer />
                                    <MutedText>
                                        {new Date(audition.audition_date!).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "2-digit", // ← SOLO 2 dígitos
                                        })}
                                    </MutedText>
                                </Pressable>
                            </Animated.View>
                        );
                    })
                )}
            </View>

            {/* CTA */}
            <View style={{ alignSelf: "flex-end", marginTop: 'auto' }}>
                <PillButton label="See all auditions" onPress={onSeeAll} />
            </View>
        </View>
    );
}
