import { useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCompanies } from '@/hooks/useCompanies';
import CompanyCard from '@/components/CompanyCard';

export default function CompaniesScreen() {
    const { data: companies, isLoading, error } = useCompanies();
    const [searchText, setSearchText] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [open, setOpen] = useState(false);
    const { width } = useWindowDimensions();

    const cardBasis = () => {
        if (width > 1200) return '23%';
        if (width > 900) return '31%';
        if( width > 600) return '45%';
        return '60%';
    };

    const countries = useMemo(() => {
        const unique = new Set(companies?.map(c => c.country).filter(Boolean));
        return Array.from(unique).sort().map(c => ({ label: c, value: c }));
    }, [companies]);

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

    const filteredCompanies = companies?.filter(company => {
        const matchesText = company.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesCountry = selectedCountry ? company.country === selectedCountry : true;
        return matchesText && matchesCountry;
    });

    return (
        <View style={styles.container}>
            <View style={styles.filtersRow}>
                {/* Input de búsqueda */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Filter companies"
                        placeholderTextColor="gray"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {/* Selector de país */}
                <View style={styles.dropdownWrapper}>
                    <DropDownPicker
                        open={open}
                        value={selectedCountry}
                        items={countries}
                        setOpen={setOpen}
                        setValue={setSelectedCountry}
                        searchable={true}
                        placeholder="Country"
                        searchPlaceholder="Search..."
                        zIndex={3000}
                        zIndexInverse={1000}
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                    />
                </View>
            </View>


            {/* Grid con flex wrap */}
            <ScrollView contentContainerStyle={styles.grid}>
                {filteredCompanies?.map((company) => (
                    <View
                        key={company.id}
                        style={[styles.cardWrapper, { flexBasis: cardBasis() }]}
                    >
                        <CompanyCard company={company} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        zIndex: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        flex: 1,
        height: 40,
        minWidth: '60%',
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 40,
    },
    dropdownWrapper: {
        flex: 1,
        zIndex: 10,
      },

    dropdown: {
        height: 40,
        minHeight: 40, // fuerza altura igual que el input
        minWidth: 0,   // elimina el minWidth interno de la lib
        borderRadius: 8,
        borderColor: '#ccc',
        paddingHorizontal: 12,
        zIndex: 20,
    },
    
    dropdownContainer: {
        borderColor: '#ccc',
        zIndex: 999,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    cardWrapper: {
        flexGrow: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
