import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER, MONO_LABEL } from '@/theme/companies';
import { RESOURCE_TYPE_ICON } from '@/constants/resources';
import { RESOURCE_TYPE_COPY } from '@/constants/resourceOnboarding';
import { ResourceCardData, ResourceRegionScope } from '@/types/resource';

interface ResourceCardProps {
  /** Solo lo que pinta la tarjeta, no la ficha entera. */
  resource: ResourceCardData;
  onPress?: () => void;
}

/** Dónde dice la tarjeta que trabaja: sus regiones, o todo el país. */
function reachLabel(resource: ResourceCardData): string {
  if (resource.region_scope === ResourceRegionScope.NATIONWIDE) return 'Nationwide';
  const names = resource.regions.map((r) => r.name);
  if (names.length === 0) return '—';
  return names.join(' · ');
}

/**
 * Una ficha en el directorio. La misma tarjeta que el profesional ve mientras
 * rellena el onboarding, para que lo que construye y lo que publicamos sean la
 * misma cosa.
 */
export default function ResourceCard({ resource, onPress }: ResourceCardProps) {
  const typeCopy = RESOURCE_TYPE_COPY[resource.type];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={resource.name}
      style={({ hovered }: any) => [
        styles.card,
        onPress && Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
        hovered && onPress && styles.cardHovered,
      ]}
    >
      <View style={styles.head}>
        <View style={styles.logoWrap}>
          {resource.logo_url ? (
            <Image source={{ uri: resource.logo_url }} style={styles.logo} resizeMode="cover" />
          ) : (
            <Ionicons name={RESOURCE_TYPE_ICON[resource.type]} size={20} color={Colors.textMuted} />
          )}
        </View>

        <View style={styles.headText}>
          <Text style={styles.type}>{typeCopy.title}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {resource.name}
            </Text>
            {resource.verified ? (
              <Ionicons name="checkmark-circle" size={15} color={Colors.text} />
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.reach} numberOfLines={1}>
        {reachLabel(resource)}
      </Text>

      {resource.description ? (
        <Text style={styles.description} numberOfLines={3}>
          {resource.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    borderRadius: 12,
    backgroundColor: Colors.white,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
  },
  cardHovered: {
    borderColor: Colors.silver,
    ...Platform.select({
      web: { boxShadow: '0 18px 42px -22px rgba(0,0,0,.18)', transform: 'scale(1.01)' } as any,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      },
    }),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoWrap: {
    width: 52,
    height: 52,
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
    gap: 3,
  },
  type: {
    fontFamily: MONO_LABEL,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontFamily: DISPLAY,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.text,
  },
  reach: {
    fontFamily: INTER,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  description: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textLightDark,
  },
});
