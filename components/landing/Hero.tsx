// components/landing/Hero.tsx
import React from "react";
import { View, Text } from "react-native";
import PillButton from "../common/PillButton";
import { Colors } from "../../theme/colors";
import { SPACING, TYPO } from "../../theme/tokens";
import UnlockingLockIcon from "./ui/UnlockingLockIcon";

type Cta = { label: string; onPress: () => void };
type Align = "center" | "left";

type Props = {
    title: string;
    subtitle?: string;
    primary?: Cta;
    secondary?: Cta;
    reviewsLabel?: string;
    align?: Align;
};

export default function Hero({
    title,
    subtitle,
    primary,
    secondary,
    reviewsLabel = "99+ reviews from dancers",
    align = "center",
}: Props) {
    const isCenter = align === "center";

    return (
        <View
            style={{
                alignItems: isCenter ? "center" : "flex-start",
            }}
        >
            {subtitle ? (
                <Text
                    style={{
                        color: Colors.textMuted,
                        ...TYPO.caption,
                        marginBottom: 8,
                        fontSize: 16,
                        textAlign: isCenter ? "center" : "left",
                    }}
                >
                    {subtitle}
                </Text>
            ) : null}

            <Text
                style={{
                    color: Colors.text,
                    ...TYPO.h1,
                    fontSize: 50,
                    lineHeight: 40,
                    marginBottom: 22,
                    textAlign: isCenter ? "center" : "left",
                }}
            >
                {title}
            </Text>

            {!!reviewsLabel && (
                <View
                    style={{
                        alignSelf: isCenter ? "center" : "flex-start",
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        backgroundColor: Colors.surface,
                        marginVertical: 14,
                    }}
                >
                    <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: "center" }}>
                        {reviewsLabel}
                    </Text>
                </View>
            )}

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: isCenter ? "center" : "flex-start",
                    marginBottom: 10,
                }}
            >
                <UnlockingLockIcon size={24} />
                <Text style={{ color: Colors.textMuted, ...TYPO.caption, textAlign: isCenter ? "center" : "left", fontSize: 18 }}>
                    Post <Text style={{ color: Colors.text }}>1 review</Text> to{" "}
                    <Text style={{ color: Colors.text }}>unlock early access</Text> to premium features.
                </Text>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    gap: SPACING.sm,
                    marginTop: 4,
                    marginBottom: 8,
                    justifyContent: isCenter ? "center" : "flex-start",
                }}
            >
                {primary && <PillButton label={primary.label} onPress={primary.onPress} />}
                {secondary && (
                    <PillButton label={secondary.label} onPress={secondary.onPress} variant="black" />
                )}
            </View>

        </View>
    );
}
