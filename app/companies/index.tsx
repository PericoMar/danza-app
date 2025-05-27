import { useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCompanies } from '@/hooks/useCompanies';
import CompanyCard from '@/components/CompanyCard';
import FilterTag from '@/components/FilterTag'; // Corrected path
import { LARGE_SCREEN_BREAKPOINT, SCREEN_SIDE_PADDING_RATIO } from '@/constants/layout';

export default function CompaniesScreen() {
    const { data: companies, isLoading, error } = useCompanies();
    const [searchText, setSearchText] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [open, setOpen] = useState(false);
    const { width } = useWindowDimensions();

    const [ratingFilter, setRatingFilter] = useState<'best' | 'worst' | null>(null);
    const [dateFilter, setDateFilter] = useState<'last' | 'first' | null>(null);
    const [verifiedFilter, setVerifiedFilter] = useState<boolean>(false);

    const cardBasis = () => {
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

    const filteredCompanies = useMemo(() => {
        if (!companies) return [];

        // 1. Base filtering (text and country)
        let processedCompanies = companies.filter(company => {
            const matchesText = company.name.toLowerCase().includes(searchText.toLowerCase());
            const matchesCountry = selectedCountry ? company.country === selectedCountry : true;
            return matchesText && matchesCountry;
        });

        // 2. Verification Filtering
        if (verifiedFilter) {
            processedCompanies = processedCompanies.filter(company => company.verified === true);
        }

        // 3. Sorting Logic
        // Create a mutable copy for sorting
        let sortedCompanies = [...processedCompanies];

        if (ratingFilter === 'best') {
            // Sort by average_rating descending (highest first), nulls last
            sortedCompanies.sort((a, b) => {
                const valA = a.average_rating ?? -Infinity;
                const valB = b.average_rating ?? -Infinity;
                return valB - valA;
            });
        } else if (ratingFilter === 'worst') {
            // Sort by average_rating ascending (lowest first), nulls last
            sortedCompanies.sort((a, b) => {
                const valA = a.average_rating ?? Infinity;
                const valB = b.average_rating ?? Infinity;
                return valA - valB;
            });
        } else if (dateFilter === 'last') {
            // Sort by last_reviewed_at descending (newest first), nulls/invalid dates last
            sortedCompanies.sort((a, b) => {
                const timeA = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0; // Treat null/invalid as very old
                const timeB = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
                return timeB - timeA;
            });
        } else if (dateFilter === 'first') {
            // Sort by last_reviewed_at ascending (oldest first), nulls/invalid dates first
            sortedCompanies.sort((a, b) => {
                const timeA = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0; // Treat null/invalid as very old
                const timeB = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
                return timeA - timeB;
            });
        }

        return sortedCompanies;
    }, [companies, searchText, selectedCountry, ratingFilter, dateFilter, verifiedFilter]);

    return (
        <View style={[styles.container, width > LARGE_SCREEN_BREAKPOINT && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO }]}>
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

            {/* Filter Tags Section */}
            <View style={styles.filterTagsContainer}>
                <FilterTag
                    label="Top Rated"
                    active={ratingFilter === 'best'}
                    onPress={() => setRatingFilter(prev => prev === 'best' ? null : 'best')}
                />
                <FilterTag
                    label="Lowest Rated"
                    active={ratingFilter === 'worst'}
                    onPress={() => setRatingFilter(prev => prev === 'worst' ? null : 'worst')}
                />
                <FilterTag
                    label="Most Recent"
                    active={dateFilter === 'last'}
                    onPress={() => setDateFilter(prev => prev === 'last' ? null : 'last')}
                />
                <FilterTag
                    label="Oldest Reviews"
                    active={dateFilter === 'first'}
                    onPress={() => setDateFilter(prev => prev === 'first' ? null : 'first')}
                />
                <FilterTag
                    label="Verified"
                    active={verifiedFilter === true}
                    onPress={() => setVerifiedFilter(prev => !prev)}
                />
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
        zIndex: 10, // Ensure dropdowns in filtersRow are above filterTagsContainer if they overlap
    },
    filterTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        alignItems: 'center',
        // zIndex: 1, // Lower zIndex than filtersRow
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
