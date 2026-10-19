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
  useNavigationContainerRef,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Company, useCompanies } from '@/hooks/useCompanies';
import { useCompanySubtypeGroups } from '@/hooks/useCompanySubtypeGroups';
import { useAuth } from '@/app/_layout';
import {
  filterCompaniesByUpcomingAuditions,
  getPrimaryAudition,
} from '@/utils/auditions';
import { parseIsoDate } from '@/utils/auditionDisplay';
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
import Entrance from '@/components/common/Entrance';
import CompanyCardSkeleton from '@/components/companies/CompanyCardSkeleton';
import CompaniesHero from '@/components/companies/CompaniesHero';
import CompaniesFilters from '@/components/companies/CompaniesFilters';
import CompaniesResultsMeta from '@/components/companies/CompaniesResultsMeta';
import type { CompanySubtypeId } from '@/types/company';
import {
  COMPANIES_ROUTE,
  COUNTRY_ROUTE_PATTERN,
  FOCUS_PARAM,
  FOCUS_SEARCH_VALUE,
} from '@/constants/routes';
import { slugify } from '@/utils/slug';
import { useEntranceStagger } from '@/hooks/useEntranceStagger';
import {
  CompaniesListingParams,
  useCompaniesListingParams,
} from '@/hooks/useCompaniesListingParams';
import { useNavigationReady } from '@/hooks/useNavigationReady';

loadCompaniesFonts();

const GRID_GAP = 24;
const SCROLL_TOP_THRESHOLD = 320;
const INFINITE_SCROLL_OFFSET = 900;
// Scroll accumulation before the sticky filter bar hides / re-appears.
const FILTERS_HIDE_ACCUM = 90;
const FILTERS_SHOW_ACCUM = 60;
const CLOSING_SOON_DAYS = 30;
// Cards entering together follow each other by this much, up to a cap so the
// last of a full page isn't kept waiting.
const CARD_STAGGER_MS = 25;
const CARD_STAGGER_MAX_STEPS = 6;

/** The filters a listing URL carries in its query string. */
function filtersFromUrl(params: CompaniesListingParams) {
  return {
    q: typeof params.q === 'string' ? params.q : '',
    upcoming: params.upcoming !== '0',
    fav: params.fav === '1',
    // Subtype ids. Checked against the catalogue once it loads, further down.
    subtypes: typeof params.types === 'string' ? params.types.split(',').filter(Boolean) : [],
  };
}

/**
 * The companies listing, at /companies and at /companies/in/[countrySlug].
 * Rendered by the layout of both, so moving between them keeps it mounted;
 * see app/(companies-listing)/_layout.tsx.
 */
export default function CompaniesListing() {
  const { data: companies, isLoading, error, refetch } = useCompanies();
  const { data: subtypeGroups } = useCompanySubtypeGroups();
  const { width } = useWindowDimensions();
  const router = useRouter();
  // Flips once the root navigator has mounted, so the URL-sync effects below
  // re-run when navigation exists. It is not a readiness check: it stays true
  // while the root navigator is being swapped, `setParams` throws in that gap
  // and nothing catches it, so the container itself gets the last word — see
  // syncParams.
  const navigationReady = useNavigationReady();
  const navigationRef = useNavigationContainerRef();

  // Writing the current view into the URL is a convenience, never worth taking
  // the app down for: if navigation isn't ready, skip this round.
  const syncParams = useCallback(
    (params: Record<string, string | undefined>) => {
      if (!navigationRef.isReady()) return;
      router.setParams(params);
    },
    [navigationRef, router]
  );
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const urlParams = useCompaniesListingParams();
  const { countrySlug, country: countryParam, [FOCUS_PARAM]: focusParam } = urlParams;

  // URL query params seed the initial filter state so the active filters survive
  // a back-navigation from a company page or a full page refresh. Captured once
  // on mount; the effects further down keep the two in step after that.
  const initialFilters = useRef({
    ...filtersFromUrl(urlParams),
    country: typeof countryParam === 'string' ? countryParam : null,
  }).current;

  const [searchText, setSearchText] = useState(initialFilters.q);
  const [countryOpen, setCountryOpen] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState(initialFilters.upcoming);
  const [favoritesFirst, setFavoritesFirst] = useState(initialFilters.fav);
  const [subtypesFilter, setSubtypesFilter] = useState<CompanySubtypeId[]>(initialFilters.subtypes);
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

  // Brings the search field into view and puts the cursor in it. The scroll and
  // the un-hiding matter: the filter bar hides itself on a downward scroll, and
  // focusing a field nobody can see looks like nothing happened.
  const focusSearch = useCallback(() => {
    setFiltersHidden(false);
    // Focus first: a browser scrolls a freshly focused field into view, and
    // that jump cuts a scroll animation started before it short.
    searchInputRef.current?.focus();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [setFiltersHidden]);

  // ⌘K / Ctrl+K focuses the search field (web only).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusSearch]);

  // The header's magnifier arrives as `?focus=search`. The param is consumed
  // right away: left in the URL a refresh or a back-navigation would steal the
  // focus again, and clearing it is also what lets a second click re-trigger
  // this effect when the listing is already the open page.
  useEffect(() => {
    if (focusParam !== FOCUS_SEARCH_VALUE) return;
    focusSearch();
    if (navigationReady) syncParams({ [FOCUS_PARAM]: undefined });
  }, [focusParam, focusSearch, navigationReady, syncParams]);

  const allCompanies = useMemo(() => (Array.isArray(companies) ? companies : []), [companies]);

  // A country lives in the path and nowhere else, on both routes. One address
  // per country: the one that can rank, the one worth sharing, the one the back
  // button steps through. Until the companies load there is nothing to match the
  // slug against, so the list shows everything for a moment rather than nothing.
  const activeCountry = useMemo(() => {
    if (!countrySlug) return null;
    return (
      allCompanies.find((c) => c.country && slugify(c.country) === countrySlug)?.country ?? null
    );
  }, [countrySlug, allCompanies]);


  // The filters that live in the query string. Only defaults-off values appear,
  // keeping the URL clean when nothing is filtered. Shared by the effect that
  // mirrors them and by the country navigation, which crosses a route boundary
  // and would otherwise drop whatever the visitor had typed.
  const queryFilters = useMemo(
    () => ({
      q: searchText.trim() || undefined,
      upcoming: upcomingFilter ? undefined : '0',
      fav: favoritesFirst ? '1' : undefined,
      types: subtypesFilter.length > 0 ? subtypesFilter.join(',') : undefined,
    }),
    [searchText, upcomingFilter, favoritesFirst, subtypesFilter],
  );

  const goToCountry = useCallback(
    (next: string | null, mode: 'push' | 'replace') => {
      // Carried into the new URL itself: it is a new history entry, and it
      // would otherwise start without them until the mirror effect below
      // caught up.
      const carried = Object.fromEntries(
        Object.entries(queryFilters).filter(([, value]) => value !== undefined),
      );
      // Branched rather than built as one object: a ternary widens `pathname`
      // to string and the typed routes stop checking anything.
      if (next) {
        router[mode]({
          pathname: COUNTRY_ROUTE_PATTERN,
          params: { countrySlug: slugify(next), ...carried },
        });
      } else {
        router[mode]({ pathname: COMPANIES_ROUTE, params: carried });
      }
    },
    [queryFilters, router],
  );

  // Pushes, so that going back from a country returns to where the visitor was
  // rather than out of the site. The redirect from a legacy `?country=` link
  // replaces instead — see below.
  const handleCountryChange = useCallback(
    (next: string | null) => goToCountry(next, 'push'),
    [goToCountry],
  );

  // `?country=` is no longer a filter the app writes — it is an entry point that
  // older links still use (the home globe sends an ISO code). Resolve it once
  // and send the visitor to the address that country actually has, carrying
  // whatever else the link was filtering by.
  useEffect(() => {
    if (filtersHydrated.current) return;
    const seed = countrySlug ? null : initialFilters.country;
    if (!seed) {
      filtersHydrated.current = true;
      return;
    }
    if (!allCompanies.length) return;
    const match = allCompanies.find(
      (c) =>
        c.country_iso_code?.toUpperCase() === seed.toUpperCase() || c.country === seed,
    );
    filtersHydrated.current = true;
    // Replaces: the legacy URL only redirects here again, so leaving it in the
    // history would make the back button bounce.
    if (match?.country) goToCountry(match.country, 'replace');
  }, [countrySlug, initialFilters.country, allCompanies, goToCountry]);

  // `?types=` may name a subtype the catalogue no longer has (a link shared
  // before it changed, or a history entry from then). Dropped as soon as the
  // catalogue is known: a filter nobody can see or untick would leave every
  // company out of the matches.
  useEffect(() => {
    if (!subtypeGroups) return;
    const known = new Set(subtypeGroups.flatMap((group) => group.subtypes.map((s) => s.id)));
    if (subtypesFilter.every((id) => known.has(id))) return;
    setSubtypesFilter(subtypesFilter.filter((id) => known.has(id)));
  }, [subtypeGroups, subtypesFilter]);

  const countryItems = useMemo(() => {
    const unique = new Set(allCompanies.map((c) => c.country).filter((c): c is string => Boolean(c)));
    return Array.from(unique)
      .sort()
      .map((c) => ({ label: c, value: c }));
  }, [allCompanies]);

  const searchIndex = useMemo(() => createCompanySearchIndex(allCompanies), [allCompanies]);

  const deferredSearchText = useDeferredValue(searchText);

  // Search, country and subtype split matches from the rest; favorites and upcoming
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
          country: activeCountry,
          subtypes: subtypesFilter,
          favoritesFirst,
          upcomingFirst: upcomingFilter,
        },
        { searchIndex },
      ),
    [
      allCompanies,
      searchIndex,
      deferredSearchText,
      activeCountry,
      favoritesFirst,
      upcomingFilter,
      subtypesFilter,
    ],
  );

  // Reset pagination whenever the ordering changes.
  useEffect(() => {
    setPage(1);
  }, [
    deferredSearchText,
    activeCountry,
    favoritesFirst,
    upcomingFilter,
    subtypesFilter,
  ]);

  // Mirror them into the URL so a back-navigation from a company page (or a
  // refresh) restores them. Skipped when the URL already says the same, as it
  // does after a navigation whose filters the state has just taken (below).
  // The URL is read, never a reason to run: writing to it in answer to a back
  // press makes expo-router take the write for a second step back, and it
  // leaves the page.
  useEffect(() => {
    if (!navigationReady || !filtersHydrated.current) return;
    const urlIsBehind = (Object.keys(queryFilters) as (keyof typeof queryFilters)[]).some(
      (key) => urlParams[key] !== queryFilters[key],
    );
    if (urlIsBehind) syncParams(queryFilters);
  }, [navigationReady, queryFilters, syncParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // The other direction. A navigation between the listing's own URLs — back
  // and forward through countries, a link to the bare /companies — lands on an
  // entry with filters of its own, and the view follows them, as it did when
  // every entry was a screen of its own. The echo of the mirror above keeps
  // the route it was written to; a navigation brings another one.
  const urlEntryKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!navigationReady) return;
    const key = navigationRef.getCurrentRoute()?.key;
    if (!key || key === urlEntryKey.current) return;
    // The entry the listing mounted on, which seeded the state already.
    const isFirstEntry = urlEntryKey.current === undefined;
    urlEntryKey.current = key;
    if (isFirstEntry) return;
    const next = filtersFromUrl(urlParams);
    setSearchText(next.q);
    setUpcomingFilter(next.upcoming);
    setFavoritesFirst(next.fav);
    setSubtypesFilter((prev) => (prev.join(',') === next.subtypes.join(',') ? prev : next.subtypes));
  }, [navigationReady, navigationRef, urlParams]);

  const upcomingCount = useMemo(
    () => filterCompaniesByUpcomingAuditions(allCompanies).length,
    [allCompanies],
  );
  const favoritesCount = useMemo(
    () => allCompanies.filter((c) => c.is_favorite === true).length,
    [allCompanies],
  );
  const closingSoonCount = useMemo(() => {
    // `next_deadline_date` is already today or later (computed by the view).
    const horizon = Date.now() + CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000;
    return allCompanies.filter((c) => {
      const deadline = getPrimaryAudition(c)?.next_deadline_date;
      return !!deadline && parseIsoDate(deadline).getTime() <= horizon;
    }).length;
  }, [allCompanies]);

  const hasActiveFilters = hasActiveMatchFilters || favoritesFirst || !upcomingFilter;

  // Leaving a country goes to the bare listing rather than through
  // handleCountryChange: that one carries the current filters into the new
  // URL, and the listing would take them back from it on arrival.
  const clearAllFilters = () => {
    setSearchText('');
    setFavoritesFirst(false);
    setUpcomingFilter(true);
    setSubtypesFilter([]);
    if (countrySlug) router.push(COMPANIES_ROUTE);
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

  // A recalculation replays the entrance of every card whose slot changed; the
  // ones that kept theirs stay still.
  const cardDelay = useEntranceStagger(
    visibleCompanies.map((c) => c.id),
    CARD_STAGGER_MS,
    CARD_STAGGER_MAX_STEPS,
  );

  const loadMoreLatch = useRef(false);
  const viewportHeight = useRef(0);

  // Infinite scroll: load the next page once the viewport nears the end.
  // Checked when the content changes size as well as on scroll: a filter that
  // shortens the list under a visitor who stays scrolled down can leave the end
  // in view, and with nowhere left to scroll, no scroll event would come.
  const loadMoreIfNearEnd = (contentHeight: number) => {
    const distanceToEnd = contentHeight - (lastScrollY.current + viewportHeight.current);
    if (distanceToEnd < INFINITE_SCROLL_OFFSET) {
      if (hasMore && !loadMoreLatch.current) {
        loadMoreLatch.current = true;
        setPage((p) => p + 1);
      }
    } else {
      loadMoreLatch.current = false;
    }
  };

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
    viewportHeight.current = layoutMeasurement.height;

    loadMoreIfNearEnd(contentSize.height);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const goToLogin = () => router.push('/login');

  // `firstSlot` is where `list` starts within the visible companies.
  const renderGrid = (list: Company[], firstSlot: number) => (
    <View style={[styles.grid, { width: contentWidth }]}>
      {list.map((company, i) => (
        <Entrance
          key={company.id}
          replayKey={firstSlot + i}
          delay={cardDelay(company.id)}
          style={{ width: cardWidth }}
        >
          <CompanyCard
            company={company}
            onCountryPress={handleCountryChange}
          />
        </Entrance>
      ))}
    </View>
  );

  const renderSkeletonGrid = () => (
    <View
      style={[styles.grid, { width: contentWidth }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading companies"
    >
      {Array.from({ length: COMPANIES_PER_PAGE }, (_, i) => (
        <View key={i} style={{ width: cardWidth }}>
          <CompanyCardSkeleton width={cardWidth} />
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
        onLayout={(e) => {
          viewportHeight.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_, contentHeight) => loadMoreIfNearEnd(contentHeight)}
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
            countryValue={activeCountry}
            countryItems={countryItems}
            onCountryChange={handleCountryChange}
            countryOpen={countryOpen}
            setCountryOpen={setCountryOpen}
            subtypeGroups={subtypeGroups ?? []}
            subtypesValue={subtypesFilter}
            onSubtypesChange={setSubtypesFilter}
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
            renderSkeletonGrid()
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
                <Entrance style={[styles.wrap, { maxWidth: wrapWidth, paddingHorizontal: hPad }]}>
                  <Text style={styles.noMatchNote}>
                    Nothing matches those filters — showing every company instead.
                  </Text>
                </Entrance>
              )}

              {renderGrid(showMatchSplit ? visibleMatches : visibleCompanies, 0)}

              {showMatchSplit && visibleRest.length > 0 && (
                <>
                  {/* Moves with the split, so it re-enters with the cards around it. */}
                  <Entrance
                    replayKey={matchCount}
                    delay={cardDelay(visibleRest[0].id)}
                    style={[styles.wrap, { maxWidth: wrapWidth, paddingHorizontal: hPad }]}
                  >
                    <View style={styles.restDivider}>
                      <View style={styles.restDividerLine} />
                      <Text style={styles.restDividerText}>Other companies</Text>
                      <View style={styles.restDividerLine} />
                    </View>
                  </Entrance>
                  {renderGrid(visibleRest, matchCount)}
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
