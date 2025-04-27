// app/companies/index.tsx
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompanies } from '@/hooks/useCompanies';
import CompanyCard from '@/components/CompanyCard';

export default function CompaniesScreen() {
    const { data: companies, isLoading, error } = useCompanies();

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text>Error loading companies</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Input de búsqueda */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Filter companies"
                    placeholderTextColor="gray"
                />
            </View>

            {/* Grid de compañías */}
            <FlatList
                data={companies}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CompanyCard company={item} />
                )}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.grid}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 40,
    },
    grid: {
        gap: 10,
    },
    row: {
        justifyContent: 'space-between',
    },
    companyCard: {
        flex: 1,
        margin: 5,
        backgroundColor: '#e6e6e6',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
