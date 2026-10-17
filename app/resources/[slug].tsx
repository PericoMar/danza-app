// app/resources/[slug].tsx
// La ficha pública de un recurso.
//
// Las secciones salen de `resource_type_fields`, el mismo guion con el que se
// rellenó: así una escuela y un fotógrafo se leen distinto sin que esta
// pantalla sepa nada de tipos.
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import ResourceDetailSections from '@/components/resources/ResourceDetailSections';
import { useResource } from '@/hooks/useResource';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER, MONO_LABEL, loadCompaniesFonts, pageHPadding } from '@/theme/companies';
import { INSIGHTS_CONTENT_MAX_WIDTH } from '@/constants/layout';
import { RESOURCE_TYPE_COPY } from '@/constants/resourceOnboarding';
import { RESOURCE_TYPE_ICON } from '@/constants/resources';
import { ResourceRegionScope } from '@/types/resource';

export default function ResourceScreen() {
  loadCompaniesFonts();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { width } = useWindowDimensions();
  const { resource, typeFields, loading, error } = useResource(slug);

  if (loading) {
    return (
      <View style={styles.screen}>
        <SiteHeader />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.text} />
        </View>
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={styles.screen}>
        <SiteHeader />
        <View style={styles.center}>
          <Text style={styles.notFound}>{error ?? 'This profile does not exist.'}</Text>
        </View>
      </View>
    );
  }

  const reach =
    resource.region_scope === ResourceRegionScope.NATIONWIDE
      ? `All of ${resource.country_name ?? resource.country_iso_code}`
      : resource.regions.map((r) => r.name).join(' · ');

  const links = [
    { url: resource.website_url, icon: 'globe-outline' as const, label: 'Website' },
    { url: resource.instagram_url, icon: 'logo-instagram' as const, label: 'Instagram' },
    { url: resource.facebook_url, icon: 'logo-facebook' as const, label: 'Facebook' },
  ].filter((link) => Boolean(link.url));

  return (
    <View style={styles.screen}>
      <Head>
        <title>{`${resource.name} · danza.app`}</title>
      </Head>
      <SiteHeader />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.page,
            { maxWidth: INSIGHTS_CONTENT_MAX_WIDTH, paddingHorizontal: pageHPadding(width) },
          ]}
        >
          <View style={styles.head}>
            <View style={styles.logoWrap}>
              {resource.logo_url ? (
                <Image source={{ uri: resource.logo_url }} style={styles.logo} resizeMode="cover" />
              ) : (
                <Ionicons
                  name={RESOURCE_TYPE_ICON[resource.type]}
                  size={28}
                  color={Colors.textMuted}
                />
              )}
            </View>

            <View style={styles.headText}>
              <Text style={styles.type}>{RESOURCE_TYPE_COPY[resource.type].title}</Text>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{resource.name}</Text>
                {resource.verified ? (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.text} />
                ) : null}
              </View>
              <Text style={styles.reach}>{reach}</Text>
            </View>
          </View>

          {resource.description ? (
            <Text style={styles.description}>{resource.description}</Text>
          ) : null}

          <View style={styles.contact}>
            {resource.no_fixed_address ? (
              <Row icon="navigate-outline" text="No fixed address" />
            ) : resource.address ? (
              <Row icon="location-outline" text={resource.address} />
            ) : null}

            {resource.emails.map((email) => (
              <Row
                key={email.id}
                icon="mail-outline"
                text={email.label ? `${email.email} · ${email.label}` : email.email}
                onPress={() => Linking.openURL(`mailto:${email.email}`)}
              />
            ))}

            {links.map((link) => (
              <Row
                key={link.label}
                icon={link.icon}
                text={link.label}
                onPress={() => Linking.openURL(link.url as string)}
              />
            ))}
          </View>

          <ResourceDetailSections resource={resource} typeFields={typeFields} />
        </View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  text,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'link' : undefined}
      style={({ hovered }: any) => [
        styles.row,
        onPress && Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
        hovered && onPress && styles.rowHovered,
      ]}
    >
      <Ionicons name={icon} size={16} color={Colors.textMuted} />
      <Text style={styles.rowText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFound: {
    fontFamily: INTER,
    fontSize: 15,
    color: Colors.textMuted,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  page: {
    width: '100%',
    paddingTop: 40,
    paddingBottom: 56,
    gap: 26,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: Colors.chromeSoft,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  type: {
    fontFamily: MONO_LABEL,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: DISPLAY,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.1,
    color: Colors.text,
  },
  reach: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.textMuted,
  },
  description: {
    fontFamily: INTER,
    fontSize: 16.5,
    lineHeight: 26,
    color: Colors.textLightDark,
  },
  contact: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  rowHovered: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 14.5,
    color: Colors.text,
  },
});
