// src/components/CompanyCard.tsx
import { View, Text, Image, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Company } from '@/hooks/useCompanies';
import { useRouter } from 'expo-router';

interface CompanyCardProps {
    company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/reviews/${company.id}`);
    };

    return (
        <Pressable
            onPress={handlePress}
            style={[styles.card, Platform.OS === 'web' && { cursor: 'pointer' }]}
        >
            {/* <Image
                source={{ uri: company.image }}
                style={styles.image}
                resizeMode="cover"
            /> */}
            <View style={styles.content}>
                {/* Nombre + verificación */}
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{company.name}</Text>
                    {!company.verified && (
                        <View style={styles.notVerifiedTag}>
                            <Text style={styles.notVerifiedText}>Not verified</Text>
                        </View>
                    )}
                </View>

                {/* Rating */}
                <View style={styles.ratingContainer}>
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
                </View>

                {/* Location */}
                <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={16} color="#888" />
                    <Text style={styles.location} numberOfLines={1}>
                        {company.location}
                    </Text>
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>
                    {company.description}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#fff',
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
    description: {
        fontSize: 12,
        color: '#666',
    },
});
