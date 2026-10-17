// app/resources/index.tsx
// El directorio: escuelas, profesores, fotógrafos, fisios y estudios.
//
// El orden de las tarjetas no se decide aquí. Lo trae la base de datos
// (`placement_rank`): región fija primero, varias después, nacionales al
// final. El cliente solo pide y pinta.
import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import FilterTag from '@/components/FilterTag';
import CountryField from '@/components/resources/CountryField';
import ResourceCard from '@/components/resources/ResourceCard';
import { useResourceDirectory } from '@/hooks/useResourceDirectory';
import { Colors } from '@/theme/colors';
import {
  DISPLAY,
  INTER,
  MONO_LABEL,
  loadCompaniesFonts,
  pageHPadding,
} from '@/theme/companies';
import {
  COMPANIES_SELECTOR_DEFAULT_WIDTH,
  RESOURCES_CONTENT_MAX_WIDTH,
  RESOURCE_GRID_2COL_MIN_WIDTH,
  RESOURCE_GRID_3COL_MIN_WIDTH,
} from '@/constants/layout';
import { RESOURCE_TYPE_COPY, RESOURCE_TYPE_ORDER } from '@/constants/resourceOnboarding';
import { ONBOARDING_ROUTE, resourcePath } from '@/constants/routes';
import { Link } from 'expo-router';

export default function ResourcesScreen() {
  loadCompaniesFonts();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const {
    countries,
    regions,
    resources,
    countryIsoCode,
    regionId,
    type,
    loading,
    error,
    chooseCountry,
    toggleRegion,
    toggleType,
  } = useResourceDirectory();

  const columns =
    width >= RESOURCE_GRID_3COL_MIN_WIDTH ? 3 : width >= RESOURCE_GRID_2COL_MIN_WIDTH ? 2 : 1;

  const cardWidth = useMemo(() => `${100 / columns}%` as const, [columns]);

  return (
    <View style={styles.screen}>
      <Head>
        <title>Resources · danza.app</title>
      </Head>
      <SiteHeader />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.page,
            { maxWidth: RESOURCES_CONTENT_MAX_WIDTH, paddingHorizontal: pageHPadding(width) },
          ]}
        >
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Resources</Text>
            <Text style={styles.title}>
              Everyone who keeps <Text style={styles.titleMuted}>dancers dancing</Text>
            </Text>
            <Text style={styles.lede}>
              Schools, teachers, photographers, physios and studios. Pick a region to see who works
              there.
            </Text>
            <Link href={ONBOARDING_ROUTE} style={styles.listYourself}>
              <Text style={styles.listYourselfLabel}>Are you one of them? Get listed →</Text>
            </Link>
          </View>

          <View style={styles.filters}>
            {/* Por encima de las píldoras de tipo, que van después en la fila y
                si no se pintarían sobre la lista abierta. */}
            <View style={{ width: Math.max(COMPANIES_SELECTOR_DEFAULT_WIDTH, 190), zIndex: 50 }}>
              <CountryField
                countries={countries}
                value={countryIsoCode}
                onChange={chooseCountry}
                placeholder="All countries"
                compact
              />
            </View>

            <View style={styles.chips}>
              {RESOURCE_TYPE_ORDER.map((option) => (
                <FilterTag
                  key={option}
                  label={RESOURCE_TYPE_COPY[option].title}
                  active={type === option}
                  onPress={() => toggleType(option)}
                />
              ))}
            </View>
          </View>

          {regions.length > 0 ? (
            <View style={styles.chips}>
              {regions.map((region) => (
                <FilterTag
                  key={region.id}
                  label={region.name}
                  active={regionId === region.id}
                  onPress={() => toggleRegion(region.id)}
                />
              ))}
            </View>
          ) : null}

          <Text style={styles.meta}>
            {loading
              ? 'Loading…'
              : `${resources.length} ${resources.length === 1 ? 'result' : 'results'}`}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.text} />
            </View>
          ) : resources.length === 0 ? (
            <Text style={styles.empty}>
              Nobody here yet. If you offer something to dancers, this is where you would show up.
            </Text>
          ) : (
            <View style={styles.grid}>
              {resources.map((resource) => (
                <View key={resource.id} style={[styles.cell, { width: cardWidth }]}>
                  <ResourceCard
                    resource={resource}
                    onPress={() => router.push(resourcePath(resource.slug))}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  page: {
    width: '100%',
    paddingTop: 40,
    paddingBottom: 56,
    gap: 20,
  },
  hero: {
    gap: 10,
    maxWidth: 760,
  },
  eyebrow: {
    fontFamily: MONO_LABEL,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.3,
    textTransform: 'uppercase',
    color: Colors.text,
  },
  titleMuted: {
    color: Colors.textMuted,
  },
  lede: {
    fontFamily: INTER,
    fontSize: 16,
    lineHeight: 23,
    color: Colors.textLightDark,
  },
  listYourself: {
    marginTop: 4,
  },
  listYourselfLabel: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    // La lista del selector de país flota sobre lo que viene debajo (regiones,
    // contador y rejilla). Sin esto, esos hermanos se pintan encima de ella.
    zIndex: 30,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 1,
  },
  meta: {
    fontFamily: MONO_LABEL,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  empty: {
    fontFamily: INTER,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textMuted,
    paddingVertical: 30,
    maxWidth: 520,
  },
  error: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.dangerText,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cell: {
    padding: 8,
  },
});
