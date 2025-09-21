import { useState, useMemo, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, ScrollView, useWindowDimensions, Pressable, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import { Company, useCompanies } from '@/hooks/useCompanies';
import CompanyCard from '@/components/CompanyCard';
import FilterTag from '@/components/FilterTag'; // Corrected path
import { LARGE_SCREEN_BREAKPOINT, SCREEN_SIDE_PADDING_RATIO } from '@/constants/layout';

export default function CompaniesScreen() {
    const { data: companies, isLoading, error } = useCompanies();

    const [searchText, setSearchText] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const { width } = useWindowDimensions();

    const [ratingFilter, setRatingFilter] = useState<'best' | 'worst' | null>(null);
    const [dateFilter, setDateFilter] = useState<'last' | 'first' | null>(null);
    const [reviewFilter, setReviewFilter] = useState<'most' | 'least' | null>(null);
    const [verifiedFilter, setVerifiedFilter] = useState(false);

    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const hasActiveFilters = Boolean(searchText || selectedCountry || ratingFilter || dateFilter || reviewFilter /* || verifiedFilter */);

    const clearAll = () => {
        setSearchText('');
        setSelectedCountry(null);
        setRatingFilter(null);
        setDateFilter(null);
        setReviewFilter(null);
        // setVerifiedFilter(false);
    };


    /* 2️⃣ Derivados con useMemo – SIEMPRE se calculan, incluso cargando */
    const countries = useMemo(() => {
        if (!Array.isArray(companies)) return [];
        const unique = new Set(companies.map(c => c.country).filter(Boolean));
        return Array.from(unique).sort().map(c => ({ label: c, value: c }));
    }, [companies]);

    const filteredCompanies = useMemo(() => {
        if (!companies) return [];

        // 1. Texto + país
        let list = companies.filter(c => {
            const matchesText =
                c.name.toLowerCase().includes(searchText.toLowerCase()) ||
                (c.description?.toLowerCase().includes(searchText.toLowerCase()) ?? false);
            const matchesCountry = selectedCountry ? c.country === selectedCountry : true;
            return matchesText && matchesCountry;
        });

        // 2. Verificadas
        if (verifiedFilter) list = list.filter(c => c.verified);

        // 3. Orden
        const byReviews =
            reviewFilter === 'most'
                ? (a: Company, b: Company) => (b.review_count ?? 0) - (a.review_count ?? 0)
                : reviewFilter === 'least'
                    ? (a: Company, b: Company) => (a.review_count ?? 0) - (b.review_count ?? 0)
                    : null;

        const byRating = ratingFilter === 'best' ? (a: Company, b: Company) => (b.average_rating ?? -Infinity) - (a.average_rating ?? -Infinity)
            : ratingFilter === 'worst' ? (a: Company, b: Company) => (a.average_rating ?? Infinity) - (b.average_rating ?? Infinity)
                : null;

        const byDate = dateFilter === 'last' ? (a: Company, b: Company) => new Date(b.last_reviewed_at ?? 0).getTime() - new Date(a.last_reviewed_at ?? 0).getTime()
            : dateFilter === 'first' ? (a: Company, b: Company) => new Date(a.last_reviewed_at ?? 0).getTime() - new Date(b.last_reviewed_at ?? 0).getTime()
                : null;

        if (byRating) return [...list].sort(byRating);
        if (byDate) return [...list].sort(byDate);
        if (byReviews) return [...list].sort(byReviews);
        return list;
    }, [
        companies,
        searchText,
        selectedCountry,
        ratingFilter,
        dateFilter,
        reviewFilter,
        verifiedFilter,
    ]);

    /* 3️⃣ Funciones puras (no hooks) */
    const cardBasis = () => (width > 900 ? '31%' : width > 600 ? '45%' : '60%');

    /* 4️⃣ Returns condicionales DESPUÉS de declarar hooks */
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
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
        <View style={[styles.container, width > LARGE_SCREEN_BREAKPOINT && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO }]}>
            <View style={styles.filtersRow}>
                <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
                    <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />

                    <TextInput
                        ref={inputRef}
                        style={[styles.input, styles.inputWeb]} // <- extra para web
                        placeholder="Search companies"
                        placeholderTextColor="gray"
                        value={searchText}
                        onChangeText={setSearchText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        returnKeyType="search"
                    />

                    {!!searchText && (
                        <Pressable
                            onPress={() => { setSearchText(''); inputRef.current?.focus(); }}
                            hitSlop={8}
                            style={styles.clearButton}
                            accessibilityRole="button"
                            accessibilityLabel="Clear search text"
                            accessibilityHint="Clears the current search"
                        >
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </Pressable>
                    )}
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

            <View style={styles.filtersWrap}>
                {/* Filter Tags Section */}
                <View style={styles.filterTagsContainer}>

                    <FilterTag
                        label="Top rated"
                        active={ratingFilter === 'best'}
                        onPress={() => setRatingFilter(prev => prev === 'best' ? null : 'best')}
                    />
                    <FilterTag
                        label="Most recent"
                        active={dateFilter === 'last'}
                        onPress={() => setDateFilter(prev => prev === 'last' ? null : 'last')}
                    />
                    <FilterTag
                        label="Most reviewed"
                        active={reviewFilter === 'most'}
                        onPress={() => setReviewFilter(prev => prev === 'most' ? null : 'most')}
                    />
                    {/* <FilterTag
                    label="Verified"
                    active={verifiedFilter === true}
                    onPress={() => setVerifiedFilter(prev => !prev)}
                /> */}
                </View>

                {/* Clear button (only if any filter is active) */}
                {hasActiveFilters && (
                    <Pressable
                        onPress={clearAll}
                        style={({ hovered }) => ([
                            styles.clearBtn,
                            hovered && styles.clearBtnHovered,
                        ])}
                        accessibilityRole="button"
                        accessibilityLabel="Clear all filters"
                        accessibilityHint="Removes every active filter"
                    >
                        <Ionicons name="close-circle" size={16} color="#111" style={{ marginRight: 8 }} />
                        <Text style={styles.clearBtnText}>Clear filters</Text>
                    </Pressable>
                )}
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
    filtersWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8, // RN moderno / RNW
        marginBottom: 16,
    },
    filterTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        // zIndex: 1, // Lower zIndex than filtersRow
    },
    // White, modern, pill button pushed to the right
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        // subtle base shadow (native)
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        // web-only drop shadow
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any : null),
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
    },
    clearBtnHovered: {
        borderColor: '#d1d5db',
        ...(Platform.OS === 'web' ? { boxShadow: '0 6px 20px rgba(0,0,0,0.10)' } as any : null),
    },
    clearBtnText: {
        color: '#111',
        fontWeight: '600',
    },
    searchContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f3f4',
        borderRadius: 10,
        height: 40,
        minWidth: '50%',
        borderWidth: 1,
        borderColor: 'transparent', // base sin borde
    },
    searchContainerFocused: {
        borderColor: '#111',        // borde cuando hay foco
        shadowColor: '#111',        // opcional: halo sutil
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    searchIcon: {
        position: 'absolute',
        fontSize: 16,
        left: 10,
        zIndex: 1,
    },
    input: {
        flex: 1,
        paddingLeft: 32,
        paddingRight: 0,
        color: '#111',
        // importante: no pongas borderWidth aquí, deja el borde al contenedor
    },
    inputWeb: Platform.OS === 'web' ? {
        outlineStyle: 'none',
    } as any : {},
    clearButton: {
        position: 'absolute',
        right: 6,
        height: 28,
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
    },
    dropdownWrapper: {
        flex: 1,
        zIndex: 10,
    },

    dropdown: {
        height: 40,
        minHeight: 40, // fuerza altura igual que el input
        minWidth: 0,
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
