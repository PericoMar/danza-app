// src/components/CompanyCard.tsx
import { View, Text, StyleSheet, Platform, Pressable, Image, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Company } from '@/hooks/useCompanies';
import { useRouter } from 'expo-router';
import { FlagCdn } from './ui/FlagCdn';
import { hasOpenAudition } from '@/utils/auditions';
import { computeStatus } from '@/utils/auditions';
import { AuditionPill } from './ui/AuditionPill';
import { LockedAuditionPill } from './ui/LockedAuditionPill';
import { useState } from 'react';
import { useAuth } from '@/app/_layout';

interface CompanyCardProps {
  company: Company;
  onCountryPress?: (country: string) => void;
}
    
export default function CompanyCard({ company, onCountryPress }: CompanyCardProps) {
    const router = useRouter();
    const { session } = useAuth();
    const isLoggedIn = !!session;

    const handlePress = () => {
        router.push(`/insights/${company.id}`);
    };

    const handleCountryPress = (event: GestureResponderEvent) => {
        // Prevent triggering card press
        event.stopPropagation();
        if (!company.country || !onCountryPress) return;
        onCountryPress(company.country);
    };

    // Teniamos una lógica para decidir si mostrar o no la audición:
    // pero vamos a mostrarla siempre que existe para que se vea que tenemos información.
    const showAudition = hasOpenAudition(company);

    const status = computeStatus(company.auditions[0] || null);


    return (
        <Pressable
            onPress={handlePress}
            style={[styles.card, Platform.OS === 'web' && { cursor: 'pointer' }]}
        >
            <Image
                source={company.image ? { uri: company.image } : undefined}
                style={styles.image}
                resizeMode="contain"
            />
            <View style={styles.content}>
                {/* Nombre + verificación */}
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{company.name}</Text>
                    {!company.verified && (
                        <View style={styles.notVerifiedTag}>
                            <Text style={styles.notVerifiedText}>Not verified</Text>
                        </View>
                    )}
                    {company.is_favorite && (
                        <Ionicons name="heart" size={16} color="#ff5151ff" />
                    )}
                </View>

                {/* Rating */}
                {/* <View style={styles.ratingContainer}>
                    <Ionicons
                        name="star"
                        size={14}
                        color={company.average_rating ? "#facc15" : "#ccc"}
                    />
                    {company.average_rating ? (
                        <>
                            <Text style={styles.ratingText}>{company.average_rating.toFixed(1)}</Text>
                            <Text style={styles.ratingSubText}>({company.rating_count})</Text>
                        </>
                    ) : (
                        <Text style={styles.ratingSubText}>No ratings yet</Text>
                    )}
                </View> */}

                {/* Location + flag, solo el país es clickable */}
                <View style={styles.locationContainer}>
                    {company.country_iso_code && (
                        <FlagCdn
                        iso={company.country_iso_code}
                        size={20}
                        style={{ marginRight: 6 }}
                        />
                    )}

                    <Pressable
                        onPress={handleCountryPress}
                        disabled={!company.country || !onCountryPress}
                        // 👇 importante: que no se estire a todo el ancho
                        style={{ alignSelf: 'flex-start' }}
                    >
                        {({ hovered }) => (
                        <Text
                            style={[
                            styles.location,
                            Platform.OS === 'web' && hovered && styles.locationHovered,
                            ]}
                            numberOfLines={1}
                        >
                            {company.country || 'Unknown Location'}
                        </Text>
                        )}
                    </Pressable>
                </View>


                {/* <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={16} color="#888" />
                    <Text style={styles.location} numberOfLines={1}>
                        {company.location || 'No specific location'}
                    </Text>
                </View> */}

                <Text style={styles.description} numberOfLines={2}>
                    {company.description}
                </Text>

                {showAudition && company.auditions[0] && isLoggedIn && (
                    <AuditionPill
                        audition={company.auditions[0]}
                        statusColor={status?.textColor}
                    />
                )}

                {showAudition && company.auditions[0] && !isLoggedIn && (
                    <LockedAuditionPill />
                )}

                {!showAudition && (
                    <View
                        style={styles.emptyAuditionPill}
                        accessibilityRole="text"
                        accessible
                        accessibilityLabel="No upcoming auditions information yet"
                    >
                        <Text style={styles.emptyAuditionText}>
                            - No auditions information currently -
                        </Text>
                    </View>
                )}


            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        margin: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 120,
    },
    content: {
        padding: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flexShrink: 1,
    },
    notVerifiedTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    notVerifiedText: {
        fontSize: 10,
        color: '#666',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 4,
        fontWeight: '600',
    },
    ratingSubText: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    locationHovered: {
        textDecorationLine: 'underline',
    },
    description: {
        fontSize: 12,
        color: '#666',
    },
    emptyAuditionPill: {
        opacity: 0.7,
        borderStyle: 'dashed',
        backgroundColor: '#ffffffff',
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyAuditionText: {
        fontStyle: 'italic',
    },

});
