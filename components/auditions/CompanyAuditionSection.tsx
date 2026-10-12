import {
  Audition,
  AuditionDateFormat,
  AuditionHeightRequirement,
  AuditionStatus,
} from "@/types/audition";
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
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getStatusBadge } from "@/utils/auditions";
import {
  formatAuditionDate,
  getAgeSpecs,
  getHeadlineDeadline,
  getHeightSpecs,
  getScheduleRows,
  parseIsoDate,
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
  /** Outer wrapper (e.g. a smaller top margin when something sits right above it). */
  style?: StyleProp<ViewStyle>;
};

type PanelProps = {
  audition: Audition;
  heights?: AuditionHeightRequirement[];
  companyName?: string;
};

const REDACTION_WIDTHS = { lg: 132, md: 104, sm: 78 } as const;
/** Width of the deadline column on wide cards; narrow ones split the width in half. */
const DEADLINE_COLUMN_WIDTH = 240;
const DEADLINE_COLUMN_WIDTH_COMPACT = 180;
/** Compact dates keep at least this width, so the places beside them line up. */
const COMPACT_DATE_MIN_WIDTH = 170;
const SUMMARY_LINE_HEIGHT = 24;
const BODY_LINE_HEIGHT = 23;
const BODY_GAP = 12;
/** Lines of the full call shown, fading out, before "Read full call" expands it. */
const DESCRIPTION_PREVIEW_LINES = 4;
const DESCRIPTION_FADE_HEIGHT = 64;
/** At or below this many days left, the deadline countdown switches to the accent colour. */
const DEADLINE_URGENT_DAYS = 7;

// ─── Data formatting ─────────────────────────────────────────────────────────

const DateKind = { DEADLINE: "Deadline", AUDITION: "Audition" } as const;
type DateKind = (typeof DateKind)[keyof typeof DateKind];

type DateEntry = {
  key: string;
  kind: DateKind;
  value: string;
  date: Date | null;
  place?: string;
  online?: boolean;
  caption?: string;
  urgent?: boolean;
  redaction: keyof typeof REDACTION_WIDTHS;
};

/** One deadline (left column) next to the audition dates that hang from it (right column). */
type ScheduleGroup = { key: string; deadline: DateEntry; dates: DateEntry[] };

/**
 * Próxima deadline abierta cuya fecha se muestra (sin `date_label`): la única
 * que admite cuenta atrás y "añadir al calendario". Un "ASAP" lleva una fecha
 * estimada que no tiene sentido anunciar.
 */
function nextDatedDeadline(audition: Audition): Date | null {
  if (audition.status !== AuditionStatus.OPEN_CALL) return null;
  const deadline = getHeadlineDeadline(audition);
  return deadline && !deadline.date_label ? parseIsoDate(deadline.date) : null;
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

function countdownCaption(days: number): string {
  if (days === 0) return "Closes today";
  return days === 1 ? "1 day left" : `${days} days left`;
}

function buildSchedule(audition: Audition): ScheduleGroup[] {
  const next = nextDatedDeadline(audition);
  const countdown = daysUntil(next);

  return getScheduleRows(audition).map(({ deadline, dates }) => {
    const isNext = !!next && deadline.date?.getTime() === next.getTime() && countdown !== null;
    return {
      key: deadline.key,
      deadline: {
        key: `deadline-${deadline.key}`,
        kind: DateKind.DEADLINE,
        value: deadline.text,
        date: deadline.date,
        caption: isNext ? countdownCaption(countdown!) : deadline.notes ?? undefined,
        urgent: isNext && countdown! <= DEADLINE_URGENT_DAYS,
        redaction: "lg",
      },
      dates: dates.map((row) => ({
        key: `audition-${row.key}`,
        kind: DateKind.AUDITION,
        value: row.when,
        date: row.start,
        place: row.place,
        online: row.format === AuditionDateFormat.ONLINE,
        caption: row.notes ?? undefined,
        redaction: "md",
      })),
    };
  });
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

type DateEntryViewProps = {
  entry: DateEntry;
  locked: boolean;
  stacked: boolean;
  /** Several audition dates: smaller values with the place beside them, not below. */
  compact: boolean;
  onAddToCalendar: (entry: DateEntry) => void;
};

/** A date as the headline: the value, where (audition dates) and a caption. */
function DateEntryView({ entry, locked, stacked, compact, onAddToCalendar }: DateEntryViewProps) {
  const valueStyle = [
    styles.entryValue,
    stacked && styles.entryValueStacked,
    compact && styles.entryValueCompact,
    !entry.date && styles.entryValueSoft,
  ];

  return (
    <View style={styles.entry}>
      <View style={compact ? styles.entryLineCompact : styles.entryLine}>
        <View style={compact && !stacked && styles.entryValueBoxCompact}>
          {locked ? (
            <View
              style={[
                styles.redaction,
                compact && styles.redactionCompact,
                { width: REDACTION_WIDTHS[entry.redaction] },
              ]}
            />
          ) : entry.date ? (
            <Pressable
              onPress={() => onAddToCalendar(entry)}
              style={({ pressed }) => [styles.entryValueRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${entry.kind}: ${entry.value}${entry.place ? `, ${entry.place}` : ""}. Add to calendar`}
            >
              <Text style={valueStyle}>{entry.value}</Text>
              <Ionicons name="calendar-outline" size={compact ? 13 : 14} color={Colors.textMuted} />
            </Pressable>
          ) : (
            <Text style={valueStyle} numberOfLines={2}>
              {entry.value}
            </Text>
          )}
        </View>

        {!!entry.place && (
          <View style={styles.entryPlace}>
            <Ionicons
              name={entry.online ? "globe-outline" : "location-outline"}
              size={13}
              color={Colors.grey2}
            />
            <Text style={styles.entryPlaceText} numberOfLines={2}>
              {entry.place}
            </Text>
          </View>
        )}
      </View>

      {!locked && !!entry.caption && (
        <Text style={[styles.entryCaption, entry.urgent && styles.entryCaptionUrgent]}>
          {entry.caption}
        </Text>
      )}
    </View>
  );
}

type ScheduleGridProps = Omit<DateEntryViewProps, "entry" | "compact"> & { groups: ScheduleGroup[] };

/**
 * Two columns — deadlines | audition dates — with each deadline on the same
 * line as its first date, so every date starts at the same height and edge.
 * One audition date gets the big headline; several go compact, deadline included.
 */
function ScheduleGrid({ groups, ...rest }: ScheduleGridProps) {
  const dateCount = groups.reduce((n, g) => n + g.dates.length, 0);
  const entryProps = { ...rest, compact: dateCount > 1 };
  const deadlineCell = entryProps.stacked
    ? styles.deadlineCellStacked
    : [styles.deadlineCell, entryProps.compact && styles.deadlineCellCompact];

  return (
    <View style={[styles.schedule, !entryProps.stacked && styles.scheduleBesideStatus]}>
      <View style={[styles.scheduleRow, entryProps.stacked && styles.scheduleRowStacked]}>
        <Text style={[styles.columnLabel, deadlineCell]} numberOfLines={1}>
          {groups.length > 1 ? "Deadlines" : "Deadline"}
        </Text>
        {dateCount > 0 && (
          <Text style={[styles.columnLabel, styles.datesCell]} numberOfLines={1}>
            {dateCount > 1 ? "Auditions" : "Audition"}
          </Text>
        )}
      </View>
      <View style={[styles.scheduleGroups, entryProps.compact && styles.scheduleGroupsCompact]}>
        {groups.map((group) => (
          <View key={group.key} style={[styles.scheduleRow, entryProps.stacked && styles.scheduleRowStacked]}>
            <View style={deadlineCell}>
              <DateEntryView entry={group.deadline} {...entryProps} />
            </View>
            <View style={[styles.datesCell, styles.datesList, entryProps.compact && styles.datesListCompact]}>
              {group.dates.map((entry) => (
                <DateEntryView key={entry.key} entry={entry} {...entryProps} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const auditionKey = (audition: Audition) => audition.id;
const auditionLabel = (audition: Audition) => audition.summary?.trim() || "audition";

export default function CompanyAuditionSection({ auditions, companyName, style }: Props) {
  if (auditions.length === 0) return null;
  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
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
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);

  const status = isLoggedIn ? getStatusBadge(audition) : null;
  const schedule = buildSchedule(audition);
  const hiddenDates = schedule.reduce((n, g) => n + 1 + g.dates.length, 0);
  const specs = [...getAgeSpecs(audition), ...getHeightSpecs(heights)];
  const scheduleLabel = isLoggedIn ? audition.schedule_label : null;

  const summaryText = (audition.summary ?? "").trim();
  const descriptionText = (audition.description ?? "").trim();
  const hasSummary = summaryText.length > 0;
  const hasDescription = descriptionText.length > 0;
  const hasHeadline = schedule.length > 0;

  // Collapsed: the whole summary plus the first lines of the call, fading out,
  // so it reads as "there is more". Until measured, assume the call is longer.
  const previewBodyHeight = DESCRIPTION_PREVIEW_LINES * BODY_LINE_HEIGHT;
  const collapsedHeight = hasSummary
    ? (summaryHeight ?? SUMMARY_LINE_HEIGHT) + BODY_GAP + previewBodyHeight
    : previewBodyHeight;
  const callIsLonger = bodyHeight === null || bodyHeight > previewBodyHeight;

  const eventSubject = companyName ?? audition.summary ?? "Audition";
  const addToCalendar = (title: string, date: Date) =>
    openCalendarEvent(title, date, audition.description ?? "");
  const onEntryCalendar = (entry: DateEntry) => {
    if (entry.date) addToCalendar(`${entry.kind}: ${eventSubject}`, entry.date);
  };

  const primaryLabel = isLoggedIn ? "Add deadline to calendar" : "Log in to unlock the dates";
  const primaryDate = isLoggedIn ? nextDatedDeadline(audition) : null;
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
      {!!scheduleLabel && <Text style={styles.scheduleLabel}>{scheduleLabel}</Text>}
      <View style={[styles.head, stacked && styles.headStacked]}>
        {hasHeadline && (
          <ScheduleGrid
            groups={schedule}
            locked={!isLoggedIn}
            stacked={stacked}
            onAddToCalendar={onEntryCalendar}
          />
        )}
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

      {/* Guest unlock box */}
      {!isLoggedIn && hiddenDates > 0 && (
        <View style={styles.unlock}>
          <View style={styles.unlockIcon}>
            <Ionicons name="lock-closed" size={14} color={Colors.grey1} />
          </View>
          <View style={styles.unlockText}>
            <Text style={styles.unlockTitle}>
              {hiddenDates === 1 ? "1 date hidden" : `${hiddenDates} dates hidden`}
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
            fadeTo={Colors.white}
            fadeHeight={DESCRIPTION_FADE_HEIGHT}
          >
            {hasSummary && (
              <Text
                style={styles.summary}
                onLayout={(e) => setSummaryHeight(e.nativeEvent.layout.height)}
              >
                {summaryText}
              </Text>
            )}
            <Text
              style={[styles.body, hasSummary && styles.bodyAfterSummary]}
              onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}
            >
              {descriptionText}
            </Text>
          </ExpandableReveal>
          {callIsLonger && (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
            >
              <Text style={styles.moreText}>{expanded ? "Show less" : "Read full call"}</Text>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Ionicons name="chevron-down" size={14} color={Colors.text} />
              </Animated.View>
            </Pressable>
          )}
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

  // Head: optional schedule summary, deadline | audition columns + status pill
  scheduleLabel: {
    marginBottom: 14,
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.grey1,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  // Narrow cards: the status goes above, the columns take the full width.
  headStacked: {
    flexDirection: "column-reverse",
    gap: 14,
  },
  schedule: {
    alignSelf: "stretch",
    gap: 10,
  },
  scheduleBesideStatus: {
    flex: 1,
  },
  scheduleGroups: {
    gap: 22,
  },
  scheduleGroupsCompact: {
    gap: 14,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 32,
  },
  scheduleRowStacked: {
    columnGap: 18,
  },
  deadlineCell: {
    width: DEADLINE_COLUMN_WIDTH,
  },
  deadlineCellCompact: {
    width: DEADLINE_COLUMN_WIDTH_COMPACT,
  },
  deadlineCellStacked: {
    flex: 1,
    minWidth: 0,
  },
  datesCell: {
    flex: 1,
    minWidth: 0,
  },
  datesList: {
    gap: 16,
  },
  datesListCompact: {
    gap: 10,
  },
  // Column heading ("Deadline" / "Auditions"): an eyebrow, unlike the place
  // under each date, which reads as plain text with a pin.
  columnLabel: {
    fontFamily: INTER,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: Colors.grey2,
  },
  entry: {
    gap: 5,
  },
  entryLine: {
    gap: 5,
  },
  // Compact: place beside the date, wrapping below it only when there's no room.
  entryLineCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 16,
    rowGap: 2,
  },
  entryValueBoxCompact: {
    minWidth: COMPACT_DATE_MIN_WIDTH,
  },
  entryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    ...webPointer,
  },
  entryValue: {
    flexShrink: 1,
    fontFamily: DISPLAY,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: Colors.text,
  },
  entryValueStacked: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  entryValueCompact: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  entryValueSoft: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  entryPlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  entryPlaceText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "500",
    color: Colors.grey1,
  },
  entryCaption: {
    fontFamily: INTER,
    fontSize: 11.5,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  entryCaptionUrgent: {
    fontWeight: "600",
    color: Colors.pinkDark,
  },
  redaction: {
    height: 22,
    marginVertical: 4,
    borderRadius: 5,
    backgroundColor: Colors.specDivider,
  },
  redactionCompact: {
    height: 16,
    marginVertical: 3,
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
    marginTop: BODY_GAP,
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
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
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
