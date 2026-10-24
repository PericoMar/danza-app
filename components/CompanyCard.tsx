// src/components/CompanyCard.tsx
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Company } from '@/hooks/useCompanies';
import { FlagCdn } from './ui/FlagCdn';
import FavoriteHeartButton from './ui/FavoriteHeartButton';
import AuditionGenderBadge from './companies/AuditionGenderBadge';
import EventParticipationBanner from './companies/EventParticipationBanner';
import AuditionAgeBadge from './companies/AuditionAgeBadge';
import CountryLink from './companies/CountryLink';
import {
  getStatusBadge,
  getAuditionGenderRestriction,
  getPrimaryAudition,
} from '@/utils/auditions';
import { getCardScheduleText } from '@/utils/auditionDisplay';
import { companyPath } from '@/constants/routes';
import { useAuth } from '@/app/_layout';
import { Colors, Gradients } from '@/theme/colors';
import { INTER, DISPLAY, CHROME_GRADIENT_START, CHROME_GRADIENT_END } from '@/theme/companies';

interface CompanyCardProps {
  company: Company;
  /** The country's page. Without it the country is plain text. */
  countryHref?: (country: string) => Href;
}

// Fixed so the audition badges can sit just below the event banner.
const EVENT_BANNER_HEIGHT = 38;

// Shared by the body and the audition strip so their text starts at the same x.
const CARD_PADDING_X = 22;

const NAME_STOPWORDS = new Set(['the', 'de', 'del', 'la', 'le', 'du', 'of', 'compañía', 'company']);

function getInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => w && !NAME_STOPWORDS.has(w.toLowerCase()));
  const source = words.length ? words : name.split(/\s+/).filter(Boolean);
  return source
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function CompanyCard({ company, countryHref }: CompanyCardProps) {
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const [hovered, setHovered] = useState(false);

  const initials = useMemo(() => getInitials(company.name), [company.name]);
  const audition = getPrimaryAudition(company);
  const showAudition = !!audition;
  const status = getStatusBadge(audition);
  const genderRestriction = getAuditionGenderRestriction(audition);
  const hasEventBanner = company.participating_in_events.length > 0;

  const goToCompany = () => router.push(companyPath(company.slug));
  const goToLogin = () => router.push('/login');


  return (
    <Pressable
      onPress={goToCompany}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityLabel={`Open ${company.name}`}
      style={[
        styles.card,
        hovered && styles.cardHovered,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
      ]}
    >
      {/* Logo panel */}
      <View style={styles.logoPanel}>
        {company.image ? (
          <Image source={{ uri: company.image }} style={styles.logoImage} resizeMode="contain" />
        ) : (
          <View style={styles.logoMark}>
            <LinearGradient
              colors={Gradients.chrome.colors}
              locations={Gradients.chrome.locations}
              start={CHROME_GRADIENT_START}
              end={CHROME_GRADIENT_END}
              style={[StyleSheet.absoluteFill, styles.logoMarkGradient]}
            />
            <Text style={styles.logoMarkText}>{initials}</Text>
          </View>
        )}

        {/* Overlays the top of the logo panel so nothing below it moves; the heart sits on top of it. */}
        <EventParticipationBanner
          events={company.participating_in_events}
          onEventPress={(eventId) => router.push(companyPath(eventId))}
          maxLines={1}
          style={styles.eventBanner}
        />

        {isLoggedIn && audition && (
          <View style={[styles.auditionBadges, hasEventBanner && styles.auditionBadgesBelowBanner]}>
            {genderRestriction && <AuditionGenderBadge gender={genderRestriction} />}
            <AuditionAgeBadge range={audition} />
          </View>
        )}

        {isLoggedIn ? (
          <View style={styles.favCircle}>
            <FavoriteHeartButton
              companyId={company.id}
              initialIsFavorite={company.is_favorite}
              size={13}
              activeColor={Colors.heartRed}
              inactiveColor={Colors.text}
              containerStyle={styles.favHit}
            />
          </View>
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              goToLogin();
            }}
            accessibilityRole="button"
            accessibilityLabel="Log in to save favourites"
            style={styles.favCircle}
          >
            <Ionicons name="heart-outline" size={14} color={Colors.text} />
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* A real anchor, so a crawler reaching the rendered list can follow it
            through to the company — and so the company's own name is the link
            text. The card around it navigates to the same place, hence the
            stopPropagation: without it one click would push the route twice. */}
        <Link
          href={companyPath(company.slug)}
          style={styles.name}
          numberOfLines={2}
          onPress={(e) => e.stopPropagation()}
        >
          {company.name}
        </Link>

        <View style={styles.meta}>
          {company.country_iso_code ? (
            <FlagCdn iso={company.country_iso_code} size={18} />
          ) : null}
          {company.country && countryHref ? (
            <CountryLink
              country={company.country}
              href={countryHref(company.country)}
              textStyle={styles.metaText}
              onPress={(e) => e.stopPropagation()}
            />
          ) : (
            <Text style={[styles.metaText, styles.metaPress]} numberOfLines={1}>
              {company.country || 'Location unknown'}
            </Text>
          )}
        </View>

        {!!company.description && (
          <Text style={styles.desc} numberOfLines={3}>
            {company.description}
          </Text>
        )}
      </View>

      {/* Audition strip */}
      {showAudition && audition && !isLoggedIn && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            goToLogin();
          }}
          accessibilityRole="button"
          accessibilityLabel="Log in to unlock audition info"
          style={({ hovered }) => [styles.auditionStrip, hovered && styles.auditionStripHovered]}
        >
          <Text style={styles.auditionLockText} numberOfLines={1}>
            Log in to unlock audition info
          </Text>
          <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
        </Pressable>
      )}

      {showAudition && audition && isLoggedIn && (
        <View style={styles.auditionStrip}>
          <Text style={styles.auditionInfoText} numberOfLines={1}>
            {getCardScheduleText(audition)}
          </Text>
          {status && (
            <View style={[styles.auStatusPill, { backgroundColor: status.bgColor }]}>
              <View style={[styles.auDot, { backgroundColor: status.textColor }]} />
              <Text style={[styles.auStatusText, { color: status.textColor }]}>
                {status.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {!showAudition && (
        <View style={[styles.auditionStrip, styles.auditionStripEmpty]}>
          <Text style={styles.auditionEmptyText}>No audition information yet</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  cardHovered: {
    borderColor: Colors.silver,
    transform: [{ scale: 1.01 }],
    ...Platform.select({
      web: { boxShadow: '0 18px 42px -22px rgba(0,0,0,.18)' },
      default: {},
    }),
  },
  eventBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EVENT_BANNER_HEIGHT,
    paddingVertical: 0,
    paddingRight: 56, // clear of the favourite circle (14 + 34 + 8)
    borderBottomWidth: 1,
    borderBottomColor: Colors.pinkBorder,
  },
  logoPanel: {
    backgroundColor: Colors.card,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logoImage: {
    width: '58%',
    height: '58%',
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 0 1px rgba(150,155,165,.45), 0 1px 0 rgba(255,255,255,.95) inset' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
    }),
  },
  logoMarkGradient: {
    borderRadius: 42,
  },
  logoMarkText: {
    fontFamily: DISPLAY,
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -0.8,
    color: '#3c3f47',
  },
  auditionBadges: {
    position: 'absolute',
    top: 18, // vertically centred on the 34px favourite circle (top 14)
    left: 14,
    right: 56, // clear of the favourite circle (14 + 34 + 8)
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  auditionBadgesBelowBanner: {
    top: EVENT_BANNER_HEIGHT + 8,
  },
  favCircle: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null),
  },
  favHit: {
    width: 34,
    height: 34,
  },
  body: {
    paddingHorizontal: CARD_PADDING_X,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 10,
    flex: 1,
  },
  name: {
    fontFamily: DISPLAY,
    fontWeight: '700',
    fontSize: 21,
    lineHeight: 24,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaPress: {
    flexShrink: 1,
  },
  metaText: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.textMuted,
  },
  desc: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textLightDark,
    marginTop: 4,
  },
  auditionStrip: {
    minHeight: 54,
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.bg,
    ...(Platform.OS === 'web' ? ({ transition: 'background-color 0.15s ease' } as any) : null),
  },
  auditionStripHovered: {
    backgroundColor: Colors.card,
  },
  auditionLockText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  auditionInfoText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 12.5,
    fontWeight: '500',
    color: Colors.text,
  },
  auStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  auDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  auStatusText: {
    fontFamily: INTER,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  auditionStripEmpty: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.rule,
  },
  auditionEmptyText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 12.5,
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
});
