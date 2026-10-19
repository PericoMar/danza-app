import React, { RefObject } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors } from '@/theme/colors';
import { INTER, pageMaxWidth, pageHPadding } from '@/theme/companies';
import {
  COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH,
  COMPANIES_SELECTOR_GAP,
  COMPANIES_SELECTOR_DEFAULT_WIDTH,
  COMPANIES_SELECTOR_MIN_WIDTH,
  COMPANIES_SELECTOR_HEIGHT,
} from '@/constants/layout';
import FilterTag from '@/components/FilterTag';
import CompanyTypeFilter from './CompanyTypeFilter';
import type { CompanySubtypeGroup, CompanySubtypeId } from '@/types/company';

interface CountryItem {
  label: string;
  value: string;
}

interface CompaniesFiltersProps {
  width: number;
  searchInputRef: RefObject<TextInput>;

  searchText: string;
  onSearchText: (v: string) => void;

  countryValue: string | null;
  countryItems: CountryItem[];
  onCountryChange: (v: string | null) => void;
  countryOpen: boolean;
  setCountryOpen: (v: boolean) => void;

  subtypeGroups: CompanySubtypeGroup[];
  subtypesValue: CompanySubtypeId[];
  onSubtypesChange: (subtypes: CompanySubtypeId[]) => void;

  upcomingActive: boolean;
  upcomingCount: number;
  onToggleUpcoming: () => void;

  favoritesActive: boolean;
  favoritesCount: number;
  onToggleFavorites: () => void;

  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export default function CompaniesFilters(props: CompaniesFiltersProps) {
  const {
    width,
    searchInputRef,
    searchText,
    onSearchText,
    countryValue,
    countryItems,
    onCountryChange,
    countryOpen,
    setCountryOpen,
    subtypeGroups,
    subtypesValue,
    onSubtypesChange,
    upcomingActive,
    upcomingCount,
    onToggleUpcoming,
    favoritesActive,
    favoritesCount,
    onToggleFavorites,
    hasActiveFilters,
    onClearAll,
  } = props;

  // Narrow phones: favorites + sex pills become icon-only so the toggle row
  // stays on a single line. Upcoming keeps its label — "Upcoming auditions"
  // is the one filter whose meaning an icon alone doesn't carry.
  const iconOnly = width <= COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH;
  // On phones the selectors drop onto their own row under the search: the
  // type filter leads on the left and the country picker sits on the right.
  const typeFirst = width <= COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH;

  // Shrink the country/type selectors to whatever width lets both sit on one
  // line within the available space, so they never wrap onto two lines on
  // narrow phones (iPhone SE/XS and similar ~375px widths).
  const innerWidth = pageMaxWidth(width) - pageHPadding(width) * 2;
  const selectorWidth = Math.max(
    COMPANIES_SELECTOR_MIN_WIDTH,
    Math.min(COMPANIES_SELECTOR_DEFAULT_WIDTH, Math.floor((innerWidth - COMPANIES_SELECTOR_GAP) / 2)),
  );

  const countrySelector = (
    <View style={[styles.countryWrap, { width: selectorWidth, zIndex: 60 }]}>
      <DropDownPicker
        open={countryOpen}
        value={countryValue}
        items={countryItems}
        setOpen={setCountryOpen as any}
        setValue={((cb: unknown) =>
          onCountryChange(typeof cb === 'function' ? cb(countryValue) : (cb as string | null))) as any}
        searchable
        placeholder="All countries"
        searchPlaceholder="Search..."
        searchPlaceholderTextColor={Colors.textMuted}
        zIndex={60}
        zIndexInverse={20}
        style={[styles.dropdown, countryValue ? styles.dropdownSelected : null]}
        placeholderStyle={styles.dropdownPlaceholder}
        labelStyle={styles.dropdownLabel}
        dropDownContainerStyle={styles.dropdownContainer}
        searchContainerStyle={styles.dropdownSearchContainer}
        searchTextInputStyle={styles.dropdownSearchInput}
        listMode="SCROLLVIEW"
        showArrowIcon={!countryValue}
      />
      {!!countryValue && (
        <Pressable
          onPress={() => onCountryChange(null)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear country filter"
          style={({ hovered }) => [
            styles.countryClear,
            Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
            hovered && styles.countryClearHovered,
          ]}
        >
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </Pressable>
      )}
    </View>
  );

  const typeSelector = (
    <CompanyTypeFilter
      width={width}
      triggerWidth={selectorWidth}
      groups={subtypeGroups}
      value={subtypesValue}
      onChange={onSubtypesChange}
    />
  );

  return (
    <View style={[styles.bar, { paddingHorizontal: pageHPadding(width) }]}>
      <View style={[styles.inner, { maxWidth: pageMaxWidth(width) }]}>
        <View style={[styles.row, { zIndex: 50 }]}>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search companies..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={onSearchText}
              returnKeyType="search"
              accessibilityLabel="Search companies"
            />
            {!!searchText && (
              <Pressable
                onPress={() => {
                  onSearchText('');
                  searchInputRef.current?.focus();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
              >
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          <View style={styles.selectorsGroup}>
            {typeFirst ? typeSelector : countrySelector}
            {typeFirst ? countrySelector : typeSelector}
          </View>
        </View>

        <View style={styles.row2}>
          <FilterTag
            label="Upcoming auditions"
            iconName="calendar-outline"
            activeIconName="calendar"
            count={upcomingCount}
            active={upcomingActive}
            variant="chrome"
            onPress={onToggleUpcoming}
            accessibilityLabel="Upcoming auditions first"
          />
          <FilterTag
            label={iconOnly ? undefined : 'Favorites'}
            iconName="heart-outline"
            activeIconName="heart"
            count={favoritesCount}
            active={favoritesActive}
            variant="chrome"
            compact={iconOnly}
            onPress={onToggleFavorites}
            accessibilityLabel="Favorites first"
          />
          {hasActiveFilters && (
            <Pressable
              onPress={onClearAll}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              style={({ hovered }) => [
                styles.clear,
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
                hovered && styles.clearHovered,
              ]}
            >
              <Text style={styles.clearText}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: Colors.bg,
    zIndex: 30,
    ...Platform.select({
      web: {
        backgroundColor: Colors.bgGlass,
        backdropFilter: 'saturate(140%) blur(12px)',
        WebkitBackdropFilter: 'saturate(140%) blur(12px)',
        boxShadow: '0 10px 24px -20px rgba(0,0,0,0.25)',
      } as any,
      default: {},
    }),
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  search: {
    flex: 1,
    minWidth: 260,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.bg,
  },
  searchInput: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15,
    color: Colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  selectorsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    flexShrink: 1,
    gap: COMPANIES_SELECTOR_GAP,
    zIndex: 60,
  },
  countryWrap: {
    width: COMPANIES_SELECTOR_DEFAULT_WIDTH,
    minWidth: COMPANIES_SELECTOR_MIN_WIDTH,
    flexShrink: 1,
  },
  dropdown: {
    minHeight: COMPANIES_SELECTOR_HEIGHT,
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.bg,
  },
  dropdownSelected: {
    // The chevron is hidden while a value is selected; leave room for the
    // inline clear button that takes its place.
    paddingRight: 40,
  },
  dropdownPlaceholder: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.text,
  },
  dropdownLabel: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.text,
  },
  dropdownContainer: {
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
  },
  dropdownSearchContainer: {
    borderBottomColor: Colors.rule,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownSearchInput: {
    height: 40,
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  countryClear: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 70,
  },
  countryClearHovered: {
    opacity: 0.6,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  clear: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  clearHovered: {
    opacity: 0.7,
  },
  clearText: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
});
