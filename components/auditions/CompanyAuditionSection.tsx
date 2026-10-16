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
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getStatusBadge } from "@/utils/auditions";
import {
  ApplicationLinkRow,
  formatAuditionDate,
  getAgeSpecs,
  getApplicationLinkRows,
  getContactEmailRows,
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
import RichText, { RICH_TEXT_LINE_HEIGHT } from "@/components/common/RichText";
import { richTextToPlainText } from "@/utils/richText";

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
/** Bars standing in for the text of hidden application links, varied so they don't read as one button. */
const LOCKED_LINK_WIDTHS = [96, 78, 88] as const;
/** Width of the deadline column on wide cards; narrow ones split the width in half. */
const DEADLINE_COLUMN_WIDTH = 240;
const DEADLINE_COLUMN_WIDTH_COMPACT = 180;
/** Compact dates keep at least this width, so the places beside them line up. */
const COMPACT_DATE_MIN_WIDTH = 170;
/** A place beside a compact date centres its first line on the date's line. */
const COMPACT_DATE_LINE_HEIGHT = 22;
const PLACE_LINE_HEIGHT = 18;
const PLACE_ICON_SIZE = 13;
/** Sits the pin on the place's first line, however many lines it wraps to. */
const PLACE_ICON_OFFSET = (PLACE_LINE_HEIGHT - PLACE_ICON_SIZE) / 2;
/** Narrow (stacked) cards set the dates 10% and the places 20% smaller. */
const STACKED_VALUE_SCALE = 0.9;
const STACKED_PLACE_SCALE = 0.8;
const SUMMARY_LINE_HEIGHT = 24;
const BODY_GAP = 12;
/** Lines of the full call shown, fading out, before "Read full call" expands it. */
const DESCRIPTION_PREVIEW_LINES = 4;
const DESCRIPTION_FADE_HEIGHT = 64;

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
  notes?: string;
  /** Only the next open deadline: "12 days left", shown ahead of its notes. */
  countdown?: string;
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

function countdownText(days: number): string {
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
        notes: deadline.notes ?? undefined,
        countdown: isNext ? countdownText(countdown!) : undefined,
        redaction: "lg",
      },
      dates: dates.map((row) => ({
        key: `audition-${row.key}`,
        kind: DateKind.AUDITION,
        value: row.when,
        date: row.start,
        place: row.place,
        online: row.format === AuditionDateFormat.ONLINE,
        notes: row.notes ?? undefined,
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

type ApplyLinksProps = {
  links: ApplicationLinkRow[];
  stacked: boolean;
  /** Guests: one locked outline per link, hiding its text like the dates, that opens the login. */
  locked: boolean;
  onLockedPress: () => void;
};

/**
 * Where to apply, as its own block above the other actions: the first link is
 * the card's main action, the rest are outlines beside it (full width on phones).
 */
function ApplyLinks({ links, stacked, locked, onLockedPress }: ApplyLinksProps) {
  return (
    <View style={styles.apply}>
      <Text style={styles.columnLabel}>How to apply</Text>
      {/* Phones stack open links full width; locked ones stay small, there's nothing to tap for yet. */}
      <View style={[styles.applyButtons, stacked && !locked && styles.applyButtonsStacked]}>
        {links.map((link, i) => {
          if (locked) {
            return (
              <Pressable
                key={link.key}
                onPress={onLockedPress}
                accessibilityRole="button"
                accessibilityLabel="Application link hidden. Log in to see it"
                style={({ hovered, pressed }) => [
                  styles.ghost,
                  styles.withIcon,
                  hovered && styles.ghostHovered,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
                <View
                  style={[
                    styles.redaction,
                    styles.redactionButton,
                    { width: LOCKED_LINK_WIDTHS[i % LOCKED_LINK_WIDTHS.length] },
                  ]}
                />
              </Pressable>
            );
          }
          const main = i === 0;
          return (
            <Pressable
              key={link.key}
              onPress={() => Linking.openURL(link.url)}
              accessibilityRole="link"
              accessibilityLabel={`${link.text}, opens ${link.host}`}
              style={({ hovered, pressed }) => [
                main ? styles.primary : styles.ghost,
                styles.withIcon,
                stacked && styles.applyButtonStacked,
                hovered && (main ? styles.primaryHovered : styles.ghostHovered),
                pressed && styles.pressed,
              ]}
            >
              <Text style={[main ? styles.primaryText : styles.ghostText, styles.applyText]} numberOfLines={1}>
                {link.text}
              </Text>
              <Ionicons name="open-outline" size={14} color={main ? Colors.white : Colors.text} />
            </Pressable>
          );
        })}
      </View>
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

/** The type metrics of a text style, scaled: drop it after the style to shrink it. */
function scaleType(style: StyleProp<TextStyle>, scale: number): TextStyle {
  const { fontSize, lineHeight, letterSpacing } = StyleSheet.flatten(style);
  return {
    ...(fontSize != null && { fontSize: fontSize * scale }),
    ...(lineHeight != null && { lineHeight: lineHeight * scale }),
    ...(letterSpacing != null && { letterSpacing: letterSpacing * scale }),
  };
}

/** A date as the headline: the value, where (audition dates), the countdown and its notes. */
function DateEntryView({ entry, locked, stacked, compact, onAddToCalendar }: DateEntryViewProps) {
  const baseValueStyle = [
    styles.entryValue,
    stacked && styles.entryValueStacked,
    compact && styles.entryValueCompact,
    !entry.date && styles.entryValueSoft,
  ];
  const valueStyle = [baseValueStyle, stacked && scaleType(baseValueStyle, STACKED_VALUE_SCALE)];
  const placeScale = stacked ? STACKED_PLACE_SCALE : 1;

  return (
    <View style={styles.entry}>
      <View
        style={
          compact ? [styles.entryLineCompact, stacked && styles.entryLineCompactWrap] : styles.entryLine
        }
      >
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
          <View style={[styles.entryPlace, compact && !stacked && styles.entryPlaceBeside]}>
            <Ionicons
              name={entry.online ? "globe-outline" : "location-outline"}
              size={PLACE_ICON_SIZE * placeScale}
              color={Colors.grey2}
              style={{ marginTop: PLACE_ICON_OFFSET * placeScale }}
            />
            <Text style={[styles.entryPlaceText, scaleType(styles.entryPlaceText, placeScale)]}>
              {entry.place}
            </Text>
          </View>
        )}
      </View>

      {!locked && (!!entry.countdown || !!entry.notes) && (
        <Text style={styles.entryCaption}>
          {!!entry.countdown && <Text style={styles.entryCountdown}>{entry.countdown}</Text>}
          {!!entry.countdown && !!entry.notes && " · "}
          {entry.notes}
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
        {groups.map((group, i) => (
          <React.Fragment key={group.key}>
            {/* A hairline between deadlines, so each one's dates read as its own block. */}
            {i > 0 && <View style={styles.groupDivider} />}
            <View style={[styles.scheduleRow, entryProps.stacked && styles.scheduleRowStacked]}>
              <View style={deadlineCell}>
                <DateEntryView entry={group.deadline} {...entryProps} />
              </View>
              <View style={[styles.datesCell, styles.datesList, entryProps.compact && styles.datesListCompact]}>
                {group.dates.map((entry) => (
                  <DateEntryView key={entry.key} entry={entry} {...entryProps} />
                ))}
              </View>
            </View>
          </React.Fragment>
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
  // Applying only makes sense while a deadline is still ahead. Guests get the
  // links locked, like the dates: they see how many there are, not where they go.
  const applyLinks = audition.status === AuditionStatus.OPEN_CALL ? getApplicationLinkRows(audition) : [];
  const showApply = applyLinks.length > 0;
  // Members: the links are the main action, so the rest of the footer steps back.
  const linksLead = isLoggedIn && showApply;
  const emails = getContactEmailRows(audition);

  const summaryText = (audition.summary ?? "").trim();
  const descriptionText = (audition.description ?? "").trim();
  const hasSummary = summaryText.length > 0;
  const hasDescription = descriptionText.length > 0;
  const hasHeadline = schedule.length > 0;

  // Collapsed: the whole summary plus the first lines of the call, fading out,
  // so it reads as "there is more". Until measured, assume the call is longer.
  const previewBodyHeight = DESCRIPTION_PREVIEW_LINES * RICH_TEXT_LINE_HEIGHT;
  const collapsedHeight = hasSummary
    ? (summaryHeight ?? SUMMARY_LINE_HEIGHT) + BODY_GAP + previewBodyHeight
    : previewBodyHeight;
  const callIsLonger = bodyHeight === null || bodyHeight > previewBodyHeight;

  const eventSubject = companyName ?? audition.summary ?? "Audition";
  const addToCalendar = (title: string, date: Date) =>
    openCalendarEvent(title, date, richTextToPlainText(descriptionText));
  const onEntryCalendar = (entry: DateEntry) => {
    if (entry.date) addToCalendar(`${entry.kind}: ${eventSubject}`, entry.date);
  };

  const primaryLabel = isLoggedIn
    ? "Add deadline to calendar"
    : showApply
      ? "Log in to unlock dates and links"
      : "Log in to unlock the dates";
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
            <RichText
              text={descriptionText}
              style={[styles.body, hasSummary && styles.bodyAfterSummary]}
              onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}
            />
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

      {/* Where to apply: the main action when there is one */}
      {showApply && (
        <ApplyLinks
          links={applyLinks}
          stacked={stacked}
          locked={!isLoggedIn}
          onLockedPress={() => router.push("/login" as any)}
        />
      )}

      {/* Footer actions (secondary once there are application links) */}
      {(showPrimary || emails.length > 0 || audition.website_url) && (
        <View style={[styles.foot, showApply && styles.footAfterApply, stacked && styles.footStacked]}>
          {showPrimary && (
            <Pressable
              onPress={onPrimary}
              style={({ pressed }) => [
                linksLead ? styles.quiet : styles.primary,
                styles.withIcon,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              {linksLead && <Ionicons name="calendar-outline" size={14} color={Colors.grey1} />}
              <Text style={linksLead ? styles.quietText : styles.primaryText}>{primaryLabel}</Text>
            </Pressable>
          )}
          {emails.map((email) => (
            <Pressable
              key={email.key}
              onPress={() => Linking.openURL(email.mailto)}
              style={({ pressed }) => [
                linksLead ? styles.quiet : styles.ghost,
                styles.withIcon,
                pressed && styles.pressed,
              ]}
              accessibilityRole="link"
              accessibilityLabel={email.label ? `${email.label}: ${email.email}` : email.email}
            >
              {linksLead && <Ionicons name="mail-outline" size={14} color={Colors.grey1} />}
              <Text style={linksLead ? styles.quietText : styles.ghostText}>
                {!!email.label && <Text style={styles.emailLabel}>{email.label} · </Text>}
                {email.email}
              </Text>
            </Pressable>
          ))}
          {!!audition.website_url && (
            <Pressable
              onPress={() => Linking.openURL(audition.website_url!)}
              style={[styles.webLink, stacked && styles.webLinkStacked]}
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
  // Narrow cards: the status goes above on the right, the columns take the full width.
  headStacked: {
    flexDirection: "column-reverse",
    alignItems: "flex-end",
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
  // The groups' gap sits on both sides of it.
  groupDivider: {
    height: 1,
    backgroundColor: Colors.rule,
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
  // Compact: place beside the date; a long place wraps within its own column.
  entryLineCompact: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 16,
    rowGap: 2,
  },
  // Narrow cards have no room for a column beside the date: the place drops below.
  entryLineCompactWrap: {
    flexWrap: "wrap",
    alignItems: "center",
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
    lineHeight: COMPACT_DATE_LINE_HEIGHT,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  entryValueSoft: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  // Shrinks to the card's width, so a long place wraps onto more lines instead of running out of the card.
  entryPlace: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    minWidth: 0,
    gap: 5,
  },
  entryPlaceBeside: {
    flex: 1,
    paddingTop: (COMPACT_DATE_LINE_HEIGHT - PLACE_LINE_HEIGHT) / 2,
  },
  entryPlaceText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 13.5,
    lineHeight: PLACE_LINE_HEIGHT,
    fontWeight: "500",
    color: Colors.grey1,
  },
  entryCaption: {
    fontFamily: INTER,
    fontSize: 11.5,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  entryCountdown: {
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
  // Same height as a button's text line, so a locked link is as tall as an open one.
  redactionButton: {
    height: 13,
    marginVertical: 2.5,
    borderRadius: 4,
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

  // Where to apply
  apply: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    gap: 12,
  },
  applyButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  applyButtonsStacked: {
    flexDirection: "column",
  },
  applyButtonStacked: {
    justifyContent: "center",
  },
  applyText: {
    flexShrink: 1,
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
  // Mobile: one action per line, all on the left.
  footStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  primary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.text,
    ...webPointer,
  },
  primaryHovered: {
    backgroundColor: Colors.grey1,
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
    ...webPointer,
  },
  ghostHovered: {
    borderColor: Colors.text,
  },
  withIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Secondary actions once the card has a "How to apply" block: text, not buttons.
  quiet: {
    paddingVertical: 4,
    ...webPointer,
  },
  quietText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.grey1,
  },
  ghostText: {
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.text,
  },
  // What an email is for, ahead of the address and quieter than it.
  emailLabel: {
    fontWeight: "500",
    color: Colors.textMuted,
  },
  footAfterApply: {
    marginTop: 16,
    paddingTop: 0,
    borderTopWidth: 0,
    columnGap: 22,
    rowGap: 6,
  },
  webLink: {
    marginLeft: "auto",
  },
  webLinkStacked: {
    marginLeft: 0,
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
