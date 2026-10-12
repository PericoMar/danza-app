import { Audition, AuditionHeightRequirement } from "@/types/audition";
import { openCalendarEvent } from "@/utils/calendar";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  useWindowDimensions,
  Animated,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { computeStatus } from "@/utils/auditions";
import {
  formatAuditionDate,
  formatAuditionDateLong,
  getAuditionScheduleRows,
  getDeadlineDisplay,
  getHeightSpecs,
} from "@/utils/auditionDisplay";
import { Colors } from "@/theme/colors";
import { DISPLAY, INTER } from "@/theme/insights";
import { INSIGHTS_TIMELINE_STACK_MAX_WIDTH } from "@/constants/layout";
import { useAuth } from "@/app/_layout";
import { useRouter } from "expo-router";
import { useNewsletter } from "@/hooks/useNewsletter";
import ExpandableReveal, { useRevealProgress } from "@/components/common/ExpandableReveal";
import CardStack from "@/components/common/CardStack";

type Props = {
  /** Active auditions, most relevant first: the first one sits on top of the stack. */
  auditions: Audition[];
  companyName?: string;
};

type PanelProps = {
  audition: Audition;
  heights?: AuditionHeightRequirement[];
  companyName?: string;
};

const REDACTION_WIDTHS = { lg: 132, md: 104, sm: 78 } as const;
/** Summary lines shown before "Read full call" expands it with the description. */
const SUMMARY_COLLAPSED_LINES = 3;
const SUMMARY_LINE_HEIGHT = 24;
const BODY_LINE_HEIGHT = 23;
/** At or below this many days left, the deadline countdown switches to the accent colour. */
const DEADLINE_URGENT_DAYS = 7;

// ─── Data formatting ─────────────────────────────────────────────────────────

type DateTile = {
  key: string;
  label: string;
  value: string;
  date: Date | null;
  caption?: string;
  urgent?: boolean;
  redaction: keyof typeof REDACTION_WIDTHS;
};

function daysUntilDeadline(audition: Audition): number | null {
  const mode = audition.deadline_mode ?? "fixed_date";
  if (mode !== "fixed_date" || !audition.deadline_date) return null;
  const d = new Date(audition.deadline_date);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

function countdownCaption(days: number): string {
  if (days === 0) return "Closes today";
  return days === 1 ? "1 day left" : `${days} days left`;
}

/** Deadline first, then every audition date — the order a dancer acts on them. */
function buildDateTiles(audition: Audition): DateTile[] {
  const tiles: DateTile[] = [];

  const deadlineDisplay = getDeadlineDisplay(audition);
  if (deadlineDisplay) {
    const isFixed = (audition.deadline_mode ?? "fixed_date") === "fixed_date";
    const date = isFixed && audition.deadline_date ? new Date(audition.deadline_date) : null;
    const countdown = daysUntilDeadline(audition);
    tiles.push({
      key: "deadline",
      label: "Deadline",
      value: date ? formatAuditionDateLong(date) : deadlineDisplay,
      date,
      caption: countdown !== null ? countdownCaption(countdown) : undefined,
      urgent: countdown !== null && countdown <= DEADLINE_URGENT_DAYS,
      redaction: "lg",
    });
  }

  getAuditionScheduleRows(audition).forEach((row, i) => {
    tiles.push({
      key: `audition-${i}`,
      label: row.entryLabel ?? "Audition",
      value: row.date ? formatAuditionDateLong(row.date) : row.label,
      date: row.date,
      redaction: "md",
    });
  });

  return tiles;
}

function truncateUrl(url: string, maxLength = 40): string {
  const stripped = url.replace(/^https?:\/\//, "");
  if (stripped.length <= maxLength) return stripped;
  const start = stripped.slice(0, Math.floor(maxLength * 0.6));
  const end = stripped.slice(stripped.length - Math.floor(maxLength * 0.3));
  return `${start}...${end}`;
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

type StatusPillProps = { label: string; textColor: string; bgColor: string; locked?: boolean };

/** Traffic-light status: pastel fill + saturated dot/label, or a neutral lock for guests. */
function StatusPill({ label, textColor, bgColor, locked }: StatusPillProps) {
  return (
    <View
      style={[styles.state, { backgroundColor: bgColor }, locked && styles.stateLocked]}
      accessibilityLabel={`Status: ${label}`}
    >
      {locked ? (
        <Ionicons name="lock-closed" size={11} color={textColor} />
      ) : (
        <View style={[styles.stateDot, { backgroundColor: textColor }]} />
      )}
      <Text style={[styles.stateText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

type DateTileViewProps = {
  tile: DateTile;
  locked: boolean;
  stacked: boolean;
  onAddToCalendar: (tile: DateTile) => void;
};

function DateTileView({ tile, locked, stacked, onAddToCalendar }: DateTileViewProps) {
  const valueStyle = [
    styles.tileValue,
    stacked && styles.tileValueStacked,
    !tile.date && styles.tileValueSoft,
  ];

  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {tile.label}
      </Text>

      {locked ? (
        <View style={[styles.redaction, { width: REDACTION_WIDTHS[tile.redaction] }]} />
      ) : tile.date ? (
        <Pressable
          onPress={() => onAddToCalendar(tile)}
          style={({ pressed }) => [styles.tileValueRow, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${tile.label}: ${tile.value}. Add to calendar`}
        >
          <Text style={valueStyle}>{tile.value}</Text>
          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
        </Pressable>
      ) : (
        <Text style={valueStyle} numberOfLines={2}>
          {tile.value}
        </Text>
      )}

      {!locked && !!tile.caption && (
        <Text style={[styles.tileCaption, tile.urgent && styles.tileCaptionUrgent]}>
          {tile.caption}
        </Text>
      )}
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const auditionKey = (audition: Audition) => audition.id;
const auditionLabel = (audition: Audition) => audition.summary?.trim() || "audition";

export default function CompanyAuditionSection({ auditions, companyName }: Props) {
  if (auditions.length === 0) return null;
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <CardStack
        items={auditions}
        keyExtractor={auditionKey}
        itemLabel={auditionLabel}
        cardStyle={styles.frame}
        renderItem={(audition) => (
          <AuditionPanel
            audition={audition}
            heights={audition.height_requirements ?? []}
            companyName={companyName}
          />
        )}
      />
    </View>
  );
}

function AuditionPanel({ audition, heights, companyName }: PanelProps) {
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const stacked = width <= INSIGHTS_TIMELINE_STACK_MAX_WIDTH;

  const { status: newsletterStatus } = useNewsletter({
    userEmail: session?.user?.email ?? null,
  });
  const newsletterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (newsletterStatus === "not_subscribed") {
      Animated.timing(newsletterAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [newsletterStatus, newsletterAnim]);

  const [expanded, setExpanded] = useState(false);
  const revealProgress = useRevealProgress(expanded);
  const chevronRotate = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const [summaryHeight, setSummaryHeight] = useState<number | null>(null);

  const status = isLoggedIn ? computeStatus(audition) : null;
  const tiles = buildDateTiles(audition);
  const specs = getHeightSpecs(heights);

  const summaryText = (audition.summary ?? "").trim();
  const descriptionText = (audition.description ?? "").trim();
  const hasSummary = summaryText.length > 0;
  const hasDescription = descriptionText.length > 0;
  const hasHeadline = tiles.length > 0 || !!audition.location;

  // Collapsed: up to N lines of summary (or of the description when there is no
  // summary). The fade only shows when that cut lands mid-text.
  const summaryMaxHeight = SUMMARY_COLLAPSED_LINES * SUMMARY_LINE_HEIGHT;
  const collapsedHeight = hasSummary
    ? Math.min(summaryHeight ?? summaryMaxHeight, summaryMaxHeight)
    : SUMMARY_COLLAPSED_LINES * BODY_LINE_HEIGHT;
  const collapsedCutsText = !hasSummary || (summaryHeight ?? 0) > summaryMaxHeight;

  const eventSubject = companyName ?? audition.summary ?? "Audition";
  const addToCalendar = (title: string, date: Date) =>
    openCalendarEvent(title, date, audition.description ?? "");
  const onTileCalendar = (tile: DateTile) => {
    if (tile.date) addToCalendar(`${tile.label}: ${eventSubject}`, tile.date);
  };

  const primaryLabel = isLoggedIn ? "Add deadline to calendar" : "Log in to unlock the dates";
  const primaryDate =
    isLoggedIn && audition.deadline_mode === "fixed_date" && audition.deadline_date
      ? new Date(audition.deadline_date)
      : null;
  const showPrimary = !isLoggedIn || !!primaryDate;
  const onPrimary = () => {
    if (!isLoggedIn) {
      router.push("/login" as any);
      return;
    }
    if (primaryDate) {
      addToCalendar(`Deadline: ${eventSubject}`, primaryDate);
    }
  };

  return (
    <View style={[styles.panel, stacked && styles.panelStacked]}>
      {/* Dates (the headline) + status */}
      <View style={styles.head}>
        <View style={[styles.tiles, stacked && styles.tilesStacked]}>
          {tiles.map((tile) => (
            <DateTileView
              key={tile.key}
              tile={tile}
              locked={!isLoggedIn}
              stacked={stacked}
              onAddToCalendar={onTileCalendar}
            />
          ))}
        </View>
        {!isLoggedIn ? (
          <StatusPill
            label="Locked"
            textColor={Colors.grey1}
            bgColor={Colors.chromeSoft}
            locked
          />
        ) : status ? (
          <StatusPill
            label={status.label}
            textColor={status.textColor}
            bgColor={status.bgColor}
          />
        ) : null}
      </View>

      {!!audition.location && (
        <View style={styles.location}>
          <Ionicons name="location-outline" size={14} color={Colors.grey2} />
          <Text style={styles.locationText}>{audition.location}</Text>
        </View>
      )}

      {/* Guest unlock box */}
      {!isLoggedIn && tiles.length > 0 && (
        <View style={styles.unlock}>
          <View style={styles.unlockIcon}>
            <Ionicons name="lock-closed" size={14} color={Colors.grey1} />
          </View>
          <View style={styles.unlockText}>
            <Text style={styles.unlockTitle}>
              {tiles.length === 1 ? "1 date hidden" : `${tiles.length} dates hidden`}
            </Text>
            <Text style={styles.unlockBody}>
              Application deadline and audition dates are members-only. Free account, one minute.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/login" as any)}
            style={styles.reveal}
            accessibilityRole="button"
          >
            <Text style={styles.revealText}>Log in to reveal</Text>
          </Pressable>
        </View>
      )}

      {hasHeadline && <View style={styles.divider} />}

      {/* Summary + full call (collapsed by default) */}
      {hasSummary && !hasDescription && <Text style={styles.summary}>{summaryText}</Text>}
      {hasDescription && (
        <View>
          <ExpandableReveal
            progress={revealProgress}
            collapsedHeight={collapsedHeight}
            fadeTo={collapsedCutsText ? Colors.white : undefined}
          >
            {hasSummary && (
              <Text
                style={styles.summary}
                onLayout={(e) => setSummaryHeight(e.nativeEvent.layout.height)}
              >
                {summaryText}
              </Text>
            )}
            <Text style={[styles.body, hasSummary && styles.bodyAfterSummary]}>
              {descriptionText}
            </Text>
          </ExpandableReveal>
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={({ pressed }) => [styles.more, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={styles.moreText}>{expanded ? "Show less" : "Read full call"}</Text>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-down" size={13} color={Colors.grey1} />
            </Animated.View>
          </Pressable>
        </View>
      )}

      {(!!audition.created_at || !!audition.content_updated_at) && (
        <View style={styles.meta}>
          {!!audition.created_at && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>Posted {formatAuditionDate(audition.created_at)}</Text>
            </View>
          )}
          {!!audition.created_at && !!audition.content_updated_at && (
            <View style={styles.metaDot} />
          )}
          {!!audition.content_updated_at && (
            <View style={styles.metaItem}>
              <Ionicons name="create-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>
                Updated {formatAuditionDate(audition.content_updated_at)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Specs */}
      {specs.length > 0 && (
        <View style={styles.specs}>
          {specs.map((spec, i) => (
            <View key={`${spec.k}-${i}`} style={styles.spec}>
              <Text style={styles.specKey}>{spec.k}</Text>
              <Text style={styles.specValue}>{spec.v}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer actions */}
      {(showPrimary || audition.email || audition.website_url) && (
        <View style={styles.foot}>
          {showPrimary && (
            <Pressable onPress={onPrimary} style={styles.primary} accessibilityRole="button">
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </Pressable>
          )}
          {!!audition.email && (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${audition.email}`)}
              style={styles.ghost}
              accessibilityRole="link"
            >
              <Text style={styles.ghostText}>{audition.email}</Text>
            </Pressable>
          )}
          {!!audition.website_url && (
            <Pressable
              onPress={() => Linking.openURL(audition.website_url!)}
              style={styles.webLink}
              accessibilityRole="link"
            >
              <Text style={styles.webLinkText}>{truncateUrl(audition.website_url)} ↗</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Newsletter banner */}
      {newsletterStatus === "not_subscribed" && (
        <Animated.View
          style={{
            opacity: newsletterAnim,
            transform: [
              { translateY: newsletterAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            ],
          }}
        >
          <Pressable
            style={styles.news}
            onPress={() => router.push("/newsletter" as any)}
            accessibilityRole="link"
            accessibilityLabel="Subscribe to audition alerts"
          >
            <Ionicons name="mail-outline" size={16} color={Colors.grey1} />
            <Text style={styles.newsText}>Never miss an audition — get weekly alerts</Text>
            <Text style={styles.newsArrow}>→</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

const styles = StyleSheet.create({
  wrap: {
    marginTop: 46,
  },
  frame: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(17,19,24,0.04), 0 24px 48px -28px rgba(30,34,44,0.32)",
      },
      default: {
        shadowColor: Colors.text,
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
      },
    }),
  },
  panel: {
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 30,
  },
  panelStacked: {
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.6,
  },

  // Head: date tiles + status pill
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  tiles: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 40,
    rowGap: 18,
  },
  tilesStacked: {
    columnGap: 24,
    rowGap: 16,
  },
  tile: {
    gap: 6,
    minWidth: 140,
    flexShrink: 1,
  },
  tileLabel: {
    fontFamily: INTER,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: Colors.grey2,
  },
  tileValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    ...webPointer,
  },
  tileValue: {
    flexShrink: 1,
    fontFamily: DISPLAY,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: Colors.text,
  },
  tileValueStacked: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  tileValueSoft: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tileCaption: {
    fontFamily: INTER,
    fontSize: 11.5,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  tileCaptionUrgent: {
    fontWeight: "600",
    color: Colors.pinkDark,
  },
  redaction: {
    height: 22,
    marginVertical: 4,
    borderRadius: 5,
    backgroundColor: Colors.specDivider,
  },
  state: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  stateLocked: {
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  stateDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stateText: {
    fontFamily: INTER,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  location: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 13.5,
    color: Colors.grey1,
  },

  // Guest unlock
  unlock: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.specSurface,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  unlockIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockText: {
    flex: 1,
    minWidth: 200,
    gap: 3,
  },
  unlockTitle: {
    fontFamily: DISPLAY,
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Colors.text,
  },
  unlockBody: {
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textLightDark,
  },
  reveal: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.text,
  },
  revealText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },

  divider: {
    height: 1,
    marginTop: 22,
    marginBottom: 20,
    backgroundColor: Colors.rule,
  },

  // Summary / full call
  summary: {
    maxWidth: 730,
    fontFamily: INTER,
    fontSize: 16,
    lineHeight: SUMMARY_LINE_HEIGHT,
    fontWeight: "500",
    letterSpacing: -0.1,
    color: Colors.text,
  },
  body: {
    maxWidth: 730,
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: BODY_LINE_HEIGHT,
    color: Colors.textLightDark,
  },
  bodyAfterSummary: {
    marginTop: 12,
  },
  more: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    ...webPointer,
  },
  moreText: {
    fontFamily: INTER,
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.grey1,
  },
  meta: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 6,
    columnGap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },

  // Specs
  specs: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.specDivider,
    overflow: "hidden",
  },
  spec: {
    flexGrow: 1,
    flexBasis: 176,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.specSurface,
    borderWidth: 0.5,
    borderColor: Colors.specDivider,
  },
  specKey: {
    fontFamily: INTER,
    fontSize: 9.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: Colors.grey2,
  },
  specValue: {
    marginTop: 6,
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: Colors.text,
  },

  // Footer
  foot: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  primary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.text,
  },
  primaryText: {
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.white,
  },
  ghost: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
  },
  ghostText: {
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.text,
  },
  webLink: {
    marginLeft: "auto",
  },
  webLinkText: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },

  // Newsletter nudge
  news: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.specSurface,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  newsText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 13.5,
    color: Colors.text,
  },
  newsArrow: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.grey1,
  },
});
