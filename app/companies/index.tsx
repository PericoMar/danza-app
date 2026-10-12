import { useState, useMemo, useRef, useEffect, useCallback, useDeferredValue } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  StyleSheet,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Platform,
} from 'react-native';
import {
  useRouter,
  useFocusEffect,
  useLocalSearchParams,
  useRootNavigationState,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Company, useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/app/_layout';
import {
  filterCompaniesByUpcomingAuditions,
  getPrimaryAudition,
} from '@/utils/auditions';
import { buildCompanyListing, createCompanySearchIndex } from '@/utils/companyListing';
import { Colors } from '@/theme/colors';
import {
  loadCompaniesFonts,
  INTER,
  pageMaxWidth,
  pageHPadding,
} from '@/theme/companies';
import {
  PAGE_CONTENT_MAX_WIDTH,
  COMPANIES_GRID_3COL_MIN_WIDTH,
  COMPANIES_GRID_2COL_MIN_WIDTH,
  COMPANIES_PER_PAGE,
  GRID_COLS_LARGE,
  GRID_COLS_MEDIUM,
  GRID_COLS_SMALL,
} from '@/constants/layout';

import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import AdsCarousel from '@/components/ui/AdsCarousel';
import CompanyCard from '@/components/CompanyCard';
import CompaniesHero from '@/components/companies/CompaniesHero';
import CompaniesFilters from '@/components/companies/CompaniesFilters';
import CompaniesResultsMeta from '@/components/companies/CompaniesResultsMeta';
import { CompanyType } from '@/types/company';

loadCompaniesFonts();

const GRID_GAP = 24;
const SCROLL_TOP_THRESHOLD = 320;
const INFINITE_SCROLL_OFFSET = 900;
// Scroll accumulation before the sticky filter bar hides / re-appears.
const FILTERS_HIDE_ACCUM = 90;
const FILTERS_SHOW_ACCUM = 60;
const CLOSING_SOON_DAYS = 30;

export default function CompaniesScreen() {
  const { data: companies, isLoading, error, refetch } = useCompanies();
  const { width } = useWindowDimensions();
  const router = useRouter();
  // `undefined` until the root navigator has mounted; guards the URL-sync effect
  // below so it can't call `router.setParams` before navigation is ready.
  const rootNavState = useRootNavigationState();
  const navigationReady = !!rootNavState?.key;
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const {
    country: countryParam,
    q: qParam,
    upcoming: upcomingParam,
    fav: favParam,
    types: typesParam,
  } = useLocalSearchParams<{
    country?: string;
    q?: string;
    upcoming?: string;
    fav?: string;
    types?: string;
  }>();

  // URL query params seed the initial filter state so the active filters survive
  // a back-navigation from a company page or a full page refresh. Captured once
  // on mount; the effect further down writes later changes back to the URL.
  const initialFilters = useRef({
    q: typeof qParam === 'string' ? qParam : '',
    country: typeof countryParam === 'string' ? countryParam : null,
    upcoming: upcomingParam !== '0',
    fav: favParam === '1',
    types: typeof typesParam === 'string'
      ? typesParam.split(',').filter((t): t is CompanyType =>
          (Object.values(CompanyType) as string[]).includes(t))
      : [],
  }).current;

  const [searchText, setSearchText] = useState(initialFilters.q);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState(initialFilters.upcoming);
  const [favoritesFirst, setFavoritesFirst] = useState(initialFilters.fav);
  const [typesFilter, setTypesFilter] = useState<CompanyType[]>(initialFilters.types);
  const [page, setPage] = useState(1);

  // Flips true once the initial `country` param has been resolved against the
  // loaded company list; until then the URL-sync effect stays idle so it can't
  // clobber an incoming param before it's applied.
  const filtersHydrated = useRef(false);

  const searchInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sticky filter bar: hides while scrolling down, slides back on scroll up.
  const filtersAnim = useRef(new Animated.Value(0)).current; // 0 = shown, 1 = hidden
  const filtersHiddenRef = useRef(false);
  const [filtersInteractive, setFiltersInteractive] = useState(true);
  const [filterBarHeight, setFilterBarHeight] = useState(180);
  const filterBarTop = useRef(0);
  const lastScrollY = useRef(0);
  const scrollAccum = useRef(0);

  const setFiltersHidden = useCallback(
    (hidden: boolean) => {
      if (filtersHiddenRef.current === hidden) return;
      filtersHiddenRef.current = hidden;
      setFiltersInteractive(!hidden);
      Animated.timing(filtersAnim, {
        toValue: hidden ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    },
    [filtersAnim],
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // ⌘K / Ctrl+K focuses the search field (web only).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const allCompanies = useMemo(() => (Array.isArray(companies) ? companies : []), [companies]);

  // Resolve the initial `country` param once companies load. Accepts an ISO code
  // (deep link from the home globe) or a country display name (restored filter).
  useEffect(() => {
    if (filtersHydrated.current) return;
    const seed = initialFilters.country;
    if (!seed) {
      filtersHydrated.current = true;
      return;
    }
    if (!allCompanies.length) return;
    const match = allCompanies.find(
      (c) =>
        c.country_iso_code?.toUpperCase() === seed.toUpperCase() || c.country === seed,
    );
    if (match?.country) setSelectedCountry(match.country);
    filtersHydrated.current = true;
  }, [initialFilters.country, allCompanies]);

  const countryItems = useMemo(() => {
    const unique = new Set(allCompanies.map((c) => c.country).filter((c): c is string => Boolean(c)));
    return Array.from(unique)
      .sort()
      .map((c) => ({ label: c, value: c }));
  }, [allCompanies]);

  const searchIndex = useMemo(() => createCompanySearchIndex(allCompanies), [allCompanies]);

  const deferredSearchText = useDeferredValue(searchText);

  // Search, country and type split matches from the rest; favorites and upcoming
  // only reorder inside each block (see utils/companyListing).
  const {
    companies: orderedCompanies,
    matchCount,
    hasMatchFilters: hasActiveMatchFilters,
  } = useMemo(
    () =>
      buildCompanyListing(
        allCompanies,
        {
          query: deferredSearchText,
          country: selectedCountry,
          types: typesFilter,
          favoritesFirst,
          upcomingFirst: upcomingFilter,
        },
        { searchIndex },
      ),
    [
      allCompanies,
      searchIndex,
      deferredSearchText,
      selectedCountry,
      favoritesFirst,
      upcomingFilter,
      typesFilter,
    ],
  );

  // Reset pagination whenever the ordering changes.
  useEffect(() => {
    setPage(1);
  }, [
    deferredSearchText,
    selectedCountry,
    favoritesFirst,
    upcomingFilter,
    typesFilter,
  ]);

  // Mirror the active filters into the URL query string so a back-navigation
  // from a company page (or a refresh) restores them. Only defaults-off values
  // are written, keeping the URL clean when nothing is filtered.
  useEffect(() => {
    if (!navigationReady || !filtersHydrated.current) return;
    const q = searchText.trim();
    router.setParams({
      q: q || undefined,
      country: selectedCountry || undefined,
      upcoming: upcomingFilter ? undefined : '0',
      fav: favoritesFirst ? '1' : undefined,
      types: typesFilter.length > 0 ? typesFilter.join(',') : undefined,
    });
  }, [
    navigationReady,
    searchText,
    selectedCountry,
    upcomingFilter,
    favoritesFirst,
    typesFilter,
    router,
  ]);

  const upcomingCount = useMemo(
    () => filterCompaniesByUpcomingAuditions(allCompanies).length,
    [allCompanies],
  );
  const favoritesCount = useMemo(
    () => allCompanies.filter((c) => c.is_favorite === true).length,
    [allCompanies],
  );
  const closingSoonCount = useMemo(() => {
    const now = Date.now();
    const horizon = now + CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000;
    return allCompanies.filter((c) => {
      const deadline = getPrimaryAudition(c)?.deadline_date;
      if (!deadline) return false;
      const t = new Date(deadline).getTime();
      return !Number.isNaN(t) && t >= now && t <= horizon;
    }).length;
  }, [allCompanies]);

  const hasActiveFilters = hasActiveMatchFilters || favoritesFirst || !upcomingFilter;

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedCountry(null);
    setFavoritesFirst(false);
    setUpcomingFilter(true);
    setTypesFilter([]);
  };

  const columnCount =
    width >= COMPANIES_GRID_3COL_MIN_WIDTH
      ? GRID_COLS_LARGE
      : width >= COMPANIES_GRID_2COL_MIN_WIDTH
        ? GRID_COLS_MEDIUM
        : GRID_COLS_SMALL;

  const hPad = pageHPadding(width);
  const wrapWidth = pageMaxWidth(width);
  const contentWidth = wrapWidth - hPad * 2;
  const cardWidth = (contentWidth - (columnCount - 1) * GRID_GAP) / columnCount;

  const visibleCompanies = orderedCompanies.slice(0, page * COMPANIES_PER_PAGE);
  const hasMore = visibleCompanies.length < orderedCompanies.length;

  // When filters are active, matched companies render first, then a divider, then
  // the rest — but only once the visible slice actually reaches the non-matches.
  const showMatchSplit =
    hasActiveMatchFilters && matchCount > 0 && matchCount < orderedCompanies.length;
  const visibleMatches = showMatchSplit
    ? visibleCompanies.slice(0, matchCount)
    : visibleCompanies;
  const visibleRest = showMatchSplit ? visibleCompanies.slice(matchCount) : [];

  const loadMoreLatch = useRef(false);

  const handleScroll = (e: {
    nativeEvent: {
      contentOffset: { y: number };
      layoutMeasurement: { height: number };
      contentSize: { height: number };
    };
  }) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const y = contentOffset?.y ?? 0;
    setShowScrollTop((prev) => (prev ? y > 120 : y > SCROLL_TOP_THRESHOLD));

    // Sticky filter bar: reveal near the top, otherwise hide on sustained
    // downward scroll and re-show on sustained upward scroll.
    const dy = y - lastScrollY.current;
    if (y <= filterBarTop.current + 4) {
      setFiltersHidden(false);
      scrollAccum.current = 0;
    } else if (dy !== 0) {
      scrollAccum.current = (dy > 0) === (scrollAccum.current > 0) ? scrollAccum.current + dy : dy;
      if (scrollAccum.current > FILTERS_HIDE_ACCUM) {
        setFiltersHidden(true);
        scrollAccum.current = 0;
      } else if (scrollAccum.current < -FILTERS_SHOW_ACCUM) {
        setFiltersHidden(false);
        scrollAccum.current = 0;
      }
    }
    lastScrollY.current = y;

    // Infinite scroll: load the next page once the viewport nears the end.
    const distanceToEnd = contentSize.height - (y + layoutMeasurement.height);
    if (distanceToEnd < INFINITE_SCROLL_OFFSET) {
      if (hasMore && !loadMoreLatch.current) {
        loadMoreLatch.current = true;
        setPage((p) => p + 1);
      }
    } else {
      loadMoreLatch.current = false;
    }
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const goToLogin = () => router.push('/login');

  const renderGrid = (list: Company[]) => (
    <View style={[styles.grid, { width: contentWidth }]}>
      {list.map((company) => (
        <View key={company.id} style={{ width: cardWidth }}>
          <CompanyCard
            company={company}
            onCountryPress={(country) => setSelectedCountry(country)}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <SiteHeader />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <AdsCarousel fullBleed />

        <CompaniesHero
          width={width}
          stats={{
            companies: allCompanies.length,
            countries: countryItems.length,
            closingSoon: closingSoonCount,
          }}
        />

        <Animated.View
          onLayout={(e) => {
            setFilterBarHeight(e.nativeEvent.layout.height);
            filterBarTop.current = e.nativeEvent.layout.y;
          }}
          pointerEvents={filtersInteractive ? 'auto' : 'none'}
          style={[
            styles.filtersSticky,
            {
              opacity: filtersAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [
                {
                  translateY: filtersAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(filterBarHeight + 24)],
                  }),
                },
              ],
            },
          ]}
        >
          <CompaniesFilters
            width={width}
            searchInputRef={searchInputRef}
            searchText={searchText}
            onSearchText={setSearchText}
            countryValue={selectedCountry}
            countryItems={countryItems}
            onCountryChange={setSelectedCountry}
            countryOpen={countryOpen}
            setCountryOpen={setCountryOpen}
            typesValue={typesFilter}
            onTypesChange={setTypesFilter}
            upcomingActive={upcomingFilter}
            upcomingCount={upcomingCount}
            onToggleUpcoming={() => setUpcomingFilter((v) => !v)}
            favoritesActive={favoritesFirst}
            favoritesCount={favoritesCount}
            onToggleFavorites={() => setFavoritesFirst((v) => !v)}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAllFilters}
          />
        </Animated.View>

        <View style={[styles.wrap, { maxWidth: wrapWidth, paddingHorizontal: hPad }]}>
          <CompaniesResultsMeta isLoggedIn={isLoggedIn} onLogin={goToLogin} />
        </View>

        <View style={styles.gridZone}>
          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={Colors.text} />
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Couldn’t load companies.</Text>
              <Text style={styles.stateBody}>Check your connection and try again.</Text>
            </View>
          ) : orderedCompanies.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>No companies yet.</Text>
              <Text style={styles.stateBody}>Check back soon — the directory updates weekly.</Text>
            </View>
          ) : (
            <>
              {hasActiveMatchFilters && matchCount === 0 && (
                <View style={[styles.wrap, { maxWidth: wrapWidth, paddingHorizontal: hPad }]}>
                  <Text style={styles.noMatchNote}>
                    Nothing matches those filters — showing every company instead.
                  </Text>
                </View>
              )}

              {renderGrid(showMatchSplit ? visibleMatches : visibleCompanies)}

              {showMatchSplit && visibleRest.length > 0 && (
                <>
                  <View style={[styles.wrap, { maxWidth: wrapWidth, paddingHorizontal: hPad }]}>
                    <View style={styles.restDivider}>
                      <View style={styles.restDividerLine} />
                      <Text style={styles.restDividerText}>Other companies</Text>
                      <View style={styles.restDividerLine} />
                    </View>
                  </View>
                  {renderGrid(visibleRest)}
                </>
              )}
            </>
          )}

          {hasMore && (
            <View style={styles.moreWrap}>
              <ActivityIndicator size="small" color={Colors.textMuted} />
            </View>
          )}
        </View>

        <SiteFooter />
      </ScrollView>

      {showScrollTop && (
        <Pressable
          onPress={scrollToTop}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
          style={({ pressed }) => [styles.scrollTop, pressed && styles.scrollTopPressed]}
        >
          <Ionicons name="arrow-up" size={18} color={Colors.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  wrap: {
    width: '100%',
    alignSelf: 'center',
  },
  filtersSticky: {
    zIndex: 30,
    ...(Platform.OS === 'web' ? ({ position: 'sticky', top: 0 } as any) : null),
  },
  gridZone: {
    paddingBottom: 80,
    paddingTop: 28,
  },
  grid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  stateBox: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontFamily: INTER,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.4,
    color: Colors.text,
  },
  stateBody: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.textMuted,
  },
  noMatchNote: {
    fontFamily: INTER,
    fontSize: 16,
    letterSpacing: 0.4,
    color: Colors.textMuted,
    paddingBottom: 18,
  },
  restDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 44,
    paddingBottom: 34,
  },
  restDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.rule,
  },
  restDividerText: {
    fontFamily: INTER,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  moreWrap: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
  },
  scrollTop: {
    position: 'absolute',
    right: 26,
    bottom: 34,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 30px -12px rgba(0,0,0,0.35)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  scrollTopPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
