// src/components/CompanyCard.tsx
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Image,
  GestureResponderEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Company } from '@/hooks/useCompanies';
import { FlagCdn } from './ui/FlagCdn';
import FavoriteHeartButton from './ui/FavoriteHeartButton';
import AuditionGenderBadge from './companies/AuditionGenderBadge';
import {
  getStatusBadge,
  getAuditionGenderRestriction,
  getPrimaryAudition,
} from '@/utils/auditions';
import {
  cardLabel,
  formatShortDate,
  getAuditionDates,
  getHeadlineAuditionDate,
  getHeadlineDeadline,
} from '@/utils/auditionDisplay';
import { Audition, AuditionStatus } from '@/types/audition';
import { CARD_MULTIPLE_DATES } from '@/constants/auditions';
import { useAuth } from '@/app/_layout';
import { Colors, Gradients } from '@/theme/colors';
import { INTER, DISPLAY, CHROME_GRADIENT_START, CHROME_GRADIENT_END } from '@/theme/companies';

interface CompanyCardProps {
  company: Company;
  onCountryPress?: (country: string) => void;
}

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

// A label replaces the date (shortened to "TBA" when it doesn't fit the strip).
function deadlineLabel(audition: Audition): string {
  const deadline = getHeadlineDeadline(audition);
  if (!deadline) return '—';
  return deadline.date_label ? cardLabel(deadline.date_label) : formatShortDate(deadline.date);
}

function auditionLabel(audition: Audition): string {
  if (audition.schedule_label) return audition.schedule_label;
  if (getAuditionDates(audition).length > 1) return CARD_MULTIPLE_DATES;
  const date = getHeadlineAuditionDate(audition);
  if (!date) return '—';
  return date.date_label ? cardLabel(date.date_label) : formatShortDate(date.start_date);
}

export default function CompanyCard({ company, onCountryPress }: CompanyCardProps) {
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const [hovered, setHovered] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 450;

  const initials = useMemo(() => getInitials(company.name), [company.name]);
  const audition = getPrimaryAudition(company);
  const showAudition = !!audition;
  const status = getStatusBadge(audition);
  const isClosed = audition?.status === AuditionStatus.PAST;
  const genderRestriction = getAuditionGenderRestriction(audition);

  const goToCompany = () => router.push(`/insights/${company.id}`);
  const goToLogin = () => router.push('/login');

  const handleCountryPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (!company.country || !onCountryPress) return;
    onCountryPress(company.country);
  };

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

        {isLoggedIn && genderRestriction && (
          <AuditionGenderBadge gender={genderRestriction} style={styles.genderBadge} />
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
        <Text style={styles.name} numberOfLines={2}>
          {company.name}
        </Text>

        <View style={styles.meta}>
          {company.country_iso_code ? (
            <FlagCdn iso={company.country_iso_code} size={18} />
          ) : null}
          <Pressable
            onPress={handleCountryPress}
            disabled={!company.country || !onCountryPress}
            style={styles.metaPress}
          >
            {({ hovered: locHovered }) => (
              <Text
                style={[styles.metaText, locHovered && styles.metaTextHovered]}
                numberOfLines={1}
              >
                {company.country || 'Location unknown'}
              </Text>
            )}
          </Pressable>
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
          <View style={styles.auIconChip}>
            <Ionicons name="lock-closed" size={16} color={Colors.grey2} />
          </View>
          <Text style={styles.auditionLockText} numberOfLines={1}>
            Log in to unlock audition info
          </Text>
          <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
        </Pressable>
      )}

      {showAudition && audition && isLoggedIn && (
        <View style={styles.auditionStrip}>
          {!compact && (
            <View style={styles.auIconChip}>
              <Text style={styles.auIconEmoji}>🩰</Text>
            </View>
          )}
          <Text style={styles.auditionInfoText} numberOfLines={1}>
            {isClosed
              ? 'Closed for the season'
              : `Deadline ${deadlineLabel(audition)}  ·  Audition ${auditionLabel(audition)}`}
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
          <View style={[styles.auIconChip, styles.auIconChipEmpty]}>
            <Text style={[styles.auIconEmoji, styles.auIconEmojiEmpty]}>🩰</Text>
          </View>
          <Text style={styles.auditionEmptyText}>No audition information yet</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
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
  genderBadge: {
    position: 'absolute',
    top: 18, // vertically centred on the 34px favourite circle (top 14)
    left: 14,
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
    padding: 22,
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
  metaTextHovered: {
    textDecorationLine: 'underline',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.white,
    ...(Platform.OS === 'web' ? ({ transition: 'background-color 0.15s ease' } as any) : null),
  },
  auditionStripHovered: {
    backgroundColor: Colors.card,
  },
  auIconChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
  },
  auIconChipEmpty: {
    backgroundColor: Colors.white,
  },
  auIconEmoji: {
    fontSize: 13,
  },
  auIconEmojiEmpty: {
    opacity: 0.45,
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
