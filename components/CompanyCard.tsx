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
import Svg, { Path } from 'react-native-svg';
import { Company } from '@/hooks/useCompanies';
import { FlagCdn } from './ui/FlagCdn';
import FavoriteHeartButton from './ui/FavoriteHeartButton';
import { hasOpenAudition, computeStatus, getAuditionGenderRestriction } from '@/utils/auditions';
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

function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function deadlineLabel(audition: Company['auditions'][number]): string {
  if (audition.deadline_mode === 'asap') return 'ASAP';
  if (audition.deadline_mode === 'always_open') return 'Open';
  return shortDate(audition.deadline_date) ?? '—';
}

function auditionLabel(audition: Company['auditions'][number]): string {
  if (audition.audition_schedule_mode === 'to_be_arranged') return 'TBA';
  if (audition.audition_schedule_mode === 'various_dates') return 'Multiple';
  return shortDate(audition.audition_date) ?? '—';
}

// Geometry for the divider between `body` and the audition strip when an
// audition is restricted to a single gender: instead of a straight line, it
// eases upward (approximating an ease/exponential rise) and then stays
// elevated all the way to the card's right edge, where it meets the card's
// border — it never comes back down.
const GENDER_DIVIDER_RISE = 34; // how high the visible line rises above the seam
const GENDER_DIVIDER_FILL_MARGIN = 40; // extra opaque headroom above the line, to fully mask text
const GENDER_DIVIDER_BASELINE_Y = GENDER_DIVIDER_RISE + GENDER_DIVIDER_FILL_MARGIN;
const GENDER_DIVIDER_PLATEAU_Y = GENDER_DIVIDER_FILL_MARGIN;
const GENDER_DIVIDER_HEIGHT = GENDER_DIVIDER_BASELINE_Y + 6;
const GENDER_DIVIDER_RISE_INSET = 66; // distance from the right edge where the rise starts
const GENDER_DIVIDER_CURVE_W = 30; // width of the up-curve itself

function buildGenderDividerPath(width: number): { strokePath: string; fillPath: string } {
  const w = Math.max(width, 0);
  const x1 = Math.max(w - GENDER_DIVIDER_RISE_INSET, 0);
  const x2 = Math.min(x1 + GENDER_DIVIDER_CURVE_W, w);
  const baseline = GENDER_DIVIDER_BASELINE_Y;
  const plateau = GENDER_DIVIDER_PLATEAU_Y;
  const curve = `C${x1 + 14},${baseline} ${x2 - 10},${plateau} ${x2},${plateau}`;
  // Visible edge: flat seam, then the rise, then flat again all the way to the border.
  const strokePath = `M0,${baseline} L${x1},${baseline} ${curve} L${w},${plateau}`;
  // Same shape closed off upward (with generous headroom) so the raised area is a
  // fully solid, opaque block — otherwise the company description text underneath
  // would show through it, especially on wide cards where it reaches further right.
  const fillPath = `M${x1},${baseline} ${curve} L${w},${plateau} L${w},0 L${x1},0 Z`;
  return { strokePath, fillPath };
}

export default function CompanyCard({ company, onCountryPress }: CompanyCardProps) {
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const [hovered, setHovered] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 450;

  const initials = useMemo(() => getInitials(company.name), [company.name]);
  const audition = company.auditions[0] ?? null;
  const showAudition = hasOpenAudition(company);
  const status = computeStatus(audition);
  const isClosed = status?.label === 'Closed' || status?.label === 'Past audition';
  const genderRestriction = getAuditionGenderRestriction(audition);
  const genderDividerGeom = useMemo(
    () => (genderRestriction && cardWidth > 0 ? buildGenderDividerPath(cardWidth) : null),
    [genderRestriction, cardWidth],
  );

  const goToCompany = () => router.push(`/insights/${company.id}`);
  const goToLogin = () => router.push('/login');

  const handleCountryPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (!company.country || !onCountryPress) return;
    onCountryPress(company.country);
  };

  const genderDivider = genderDividerGeom && (
    <View pointerEvents="none" style={[styles.genderDividerWrap, { width: cardWidth }]}>
      <Svg width={cardWidth} height={GENDER_DIVIDER_HEIGHT}>
        <Path d={genderDividerGeom.fillPath} fill={Colors.white} stroke="none" />
        <Path d={genderDividerGeom.strokePath} stroke={Colors.rule} strokeWidth={1} fill="none" />
      </Svg>
      <View
        style={styles.genderDividerIcon}
        accessibilityLabel={
          genderRestriction === 'male' ? 'Open to men only' : 'Open to women only'
        }
      >
        <Ionicons name={genderRestriction!} size={17} color={Colors.textMuted} />
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={goToCompany}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
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
          style={({ hovered }) => [
            styles.auditionStrip,
            genderDividerGeom && styles.auditionStripNoTopBorder,
            hovered && styles.auditionStripHovered,
          ]}
        >
          {genderDivider}
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
        <View
          style={[styles.auditionStrip, genderDividerGeom && styles.auditionStripNoTopBorder]}
        >
          {genderDivider}
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
  auditionStripNoTopBorder: {
    borderTopWidth: 0,
  },
  genderDividerWrap: {
    position: 'absolute',
    left: 0,
    top: -GENDER_DIVIDER_BASELINE_Y,
    height: GENDER_DIVIDER_HEIGHT,
    zIndex: 5,
  },
  genderDividerIcon: {
    position: 'absolute',
    top: GENDER_DIVIDER_PLATEAU_Y + 2,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
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
