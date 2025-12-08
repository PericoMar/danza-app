import { useState, useMemo, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, ScrollView, useWindowDimensions, Pressable, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import { Company, useCompanies } from '@/hooks/useCompanies';
import CompanyCard from '@/components/CompanyCard';
import FilterTag from '@/components/FilterTag'; // Corrected path
import { LARGE_SCREEN_BREAKPOINT_IN_COMPANIES, SCREEN_SIDE_PADDING_RATIO } from '@/constants/layout';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { compareCompaniesByUpcomingAuditions } from '@/utils/auditions';

export default function CompaniesScreen() {
    const { data: companies, isLoading, error, refetch } = useCompanies();

    if (error) {
        console.error("Error loading companies:", error);
    }

    const [searchText, setSearchText] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const { width } = useWindowDimensions();

    const [ratingFilter, setRatingFilter] = useState<'best' | 'worst' | null>(null);
    // const [dateFilter, setDateFilter] = useState<'last' | 'first' | null>(null);
    const [reviewFilter, setReviewFilter] = useState<'most' | 'least' | null>(null);
    // const [verifiedFilter, setVerifiedFilter] = useState(false);
    const [upcomingFilter, setUpcomingFilter] = useState(true);
    const [favoritesOnly, setFavoritesOnly] = useState(false);

    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const listRef = useRef<FlatList<Company>>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useFocusEffect(
        useCallback(() => {
            // cada vez que entras o vuelves a esta pantalla
            refetch();
        }, [refetch])
    );

    const hasActiveFilters = Boolean(
        searchText ||
        selectedCountry ||
        ratingFilter ||
        reviewFilter ||
        // dateFilter ||
        // verifiedFilter ||
        upcomingFilter ||
        favoritesOnly
    );

    const clearAllFilters = () => {
        setSearchText('');
        setSelectedCountry(null);
        setRatingFilter(null);
        // setDateFilter(null);
        setReviewFilter(null);
        // setVerifiedFilter(false);
        setUpcomingFilter(false);
        setFavoritesOnly(false);
    };

    const clearButtonsFilters = () => {
        setRatingFilter(null);
        setReviewFilter(null);
        // setDateFilter(null);
        // setVerifiedFilter(false);
        setUpcomingFilter(false);
    };


    /* 2️⃣ Derivados con useMemo – SIEMPRE se calculan, incluso cargando */
    const countries = useMemo(() => {
        if (!Array.isArray(companies)) return [];
        const unique = new Set(companies.map(c => c.country).filter((c): c is string => Boolean(c)));
        return Array.from(unique).sort().map((c) => ({ label: c, value: c }));
    }, [companies]);

    function getNextUpcomingDeadlineTimestamp(company: Company): number | null {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const auditions = (company as any).auditions as
            | { deadline_date?: string | null }[]
            | undefined;

        if (!Array.isArray(auditions)) return null;

        const timestamps = auditions
            .map(a => a?.deadline_date)
            .filter((d): d is string => Boolean(d))
            .map(d => new Date(d))
            .map(date => {
                date.setHours(0, 0, 0, 0);
                return date;
            })
            .filter(date => date.getTime() > today.getTime())
            .map(date => date.getTime());

        if (!timestamps.length) return null;

        return Math.min(...timestamps);
    }


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
        // if (verifiedFilter) list = list.filter(c => c.verified);

        // 3. Solo favoritos (filtro adicional)
        if (favoritesOnly) {
            list = list.filter(c => (c as any).is_favorite === true);
        }

        // 4. Orden
        const byReviews =
            reviewFilter === 'most'
                ? (a: Company, b: Company) => (b.review_count ?? 0) - (a.review_count ?? 0)
                : reviewFilter === 'least'
                    ? (a: Company, b: Company) => (a.review_count ?? 0) - (b.review_count ?? 0)
                    : null;

        const byRating =
            ratingFilter === 'best'
                ? (a: Company, b: Company) =>
                    (b.average_rating ?? -Infinity) - (a.average_rating ?? -Infinity)
                : ratingFilter === 'worst'
                    ? (a: Company, b: Company) =>
                        (a.average_rating ?? Infinity) - (b.average_rating ?? Infinity)
                    : null;

        const byUpcoming =  upcomingFilter ? compareCompaniesByUpcomingAuditions : null;

        // Prioridad del orden:
        // 1) Upcoming auditions
        // 2) Rating
        // 3) Reviews
        if (byUpcoming) return [...list].sort(byUpcoming);
        if (byRating) return [...list].sort(byRating);
        if (byReviews) return [...list].sort(byReviews);

        return list;
    }, [
        companies,
        searchText,
        selectedCountry,
        ratingFilter,
        reviewFilter,
        // verifiedFilter,
        upcomingFilter,
        favoritesOnly,
    ]);


    /* 3️⃣ Funciones puras (no hooks) */
    const columnCount = width > 900 ? 3 : width > 600 ? 2 : 1;

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

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset?.y ?? 0;
        // Mostrar el botón a partir de X píxeles de scroll
        if (offsetY > 300 && !showScrollTop) {
            setShowScrollTop(true);
        } else if (offsetY <= 300 && showScrollTop) {
            setShowScrollTop(false);
        }
    };

    const scrollToTop = () => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    return (
        <View style={[styles.container, width > LARGE_SCREEN_BREAKPOINT_IN_COMPANIES && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO }]}>
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
                        onPress={() => {
                            clearButtonsFilters();
                            setRatingFilter(prev => (prev === 'best' ? null : 'best'));
                        }}
                    />

                    {/* <FilterTag
                        label="Most recent"
                        active={dateFilter === 'last'}
                        onPress={() => setDateFilter(prev => prev === 'last' ? null : 'last')}
                    /> */}

                    <FilterTag
                        label="Most reviewed"
                        active={reviewFilter === 'most'}
                        onPress={() => {
                            clearButtonsFilters();
                            setReviewFilter(prev => (prev === 'most' ? null : 'most'));
                        }}
                    />

                    {/* <FilterTag
                        label="Verified"
                        active={verifiedFilter === true}
                        onPress={() => setVerifiedFilter(prev => !prev)}
                    /> */}

                    <FilterTag
                        label="Upcoming auditions"
                        active={upcomingFilter}
                        onPress={() => {
                            clearButtonsFilters();
                            setUpcomingFilter(prev => !prev);
                        }}
                    />

                    <FilterTag
                        active={favoritesOnly}
                        onPress={() => setFavoritesOnly(prev => !prev)}
                        iconName="heart-outline"
                        activeIconName="heart"
                    // opcional: si quieres texto también
                    // label="Favorites"
                    />

                </View>


                {/* Clear button (only if any filter is active) */}
                {hasActiveFilters && (
                    <Pressable
                        onPress={clearAllFilters}
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

            {/* Grid responsive con FlatList */}
            <FlatList<Company>
                ref={listRef}
                key={`cols-${columnCount}`}
                data={filteredCompanies}
                keyExtractor={(item) => String(item.id)}
                numColumns={columnCount}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                    <CompanyCard
                        company={item}
                        onCountryPress={(country) => setSelectedCountry(country)}
                    />
                    </View>
                )}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={columnCount > 1 ? styles.gridRow : undefined}
                showsVerticalScrollIndicator={false}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={Platform.OS !== 'web'}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                />


            {/* Scroll to top button */}
            {showScrollTop && (
                <Pressable
                    onPress={scrollToTop}
                    style={({ pressed }) => [
                        styles.scrollTopButton,
                        pressed && styles.scrollTopButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Scroll to top"
                    accessibilityHint="Scrolls the companies list back to the top"
                >
                    <Ionicons name="arrow-up" size={18} color="#000" />
                </Pressable>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
        position: 'relative'
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
    favoriteIconButton: {
        marginLeft: 'auto',
        paddingHorizontal: 8,
        paddingVertical: 4,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
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
        fontSize: 12,
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
        paddingBottom: 16,
        paddingTop: 8,
    },

    gridRow: {
        flex: 1,
        justifyContent: 'space-between',
        marginBottom: 8,
    },

    cardWrapper: {
        flex: 1,
        marginHorizontal: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    scrollTopButton: {
        position: 'absolute',
        right: 26,
        bottom: 34,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',

        // Sombra en iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,

        // Sombra en Android
        elevation: 4,
    },
    scrollTopButtonPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.9,
    },
});
