import { Audition, AuditionHeightRequirement, AuditionScheduleEntry } from "@/types/audition";
import { openCalendarEvent } from "@/utils/calendar";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  Linking,
  useWindowDimensions,
  Animated,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { computeStatus } from "@/utils/auditions";
import { Colors } from "@/theme/colors";
import { DISPLAY, INTER } from "@/theme/insights";
import {
  INSIGHTS_TIMELINE_STACK_MAX_WIDTH,
  DESCRIPTION_CLAMP_MIN_CHARS,
} from "@/constants/layout";
import { useAuth } from "@/app/_layout";
import { useRouter } from "expo-router";
import { useNewsletter } from "@/hooks/useNewsletter";

type Props = {
  audition: Audition | null;
  heights?: AuditionHeightRequirement[];
  companyName?: string;
};

const REDACTION_WIDTHS = { lg: 132, md: 104, sm: 78 } as const;

// ─── Data formatting ─────────────────────────────────────────────────────────

function formatDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return d ?? "—";
  }
}

function getDeadlineDisplay(audition: Audition): string | null {
  const mode = audition.deadline_mode ?? "fixed_date";
  if (mode === "asap") return "ASAP";
  if (mode === "always_open") return "Always open";
  if (audition.deadline_date) return formatDate(audition.deadline_date);
  return null;
}

type TimelineNode = {
  key: string;
  label: string;
  value: string;
  date: Date | null;
  redaction: keyof typeof REDACTION_WIDTHS;
};

function getAuditionRows(audition: Audition): { label: string; date: Date | null }[] {
  const rows: { label: string; date: Date | null }[] = [];
  const mode =
    audition.audition_schedule_mode ?? (audition.audition_date ? "single_date" : null);

  if (mode === "to_be_arranged") {
    const note = audition.audition_schedule_note?.trim();
    rows.push({ label: note && note.length > 0 ? note : "To be arranged", date: null });
    return rows;
  }

  if (mode === "various_dates") {
    const entries = (audition.audition_schedule_entries ?? []) as AuditionScheduleEntry[];
    for (const entry of entries) {
      if (!entry.date) continue;
      const label = entry.label?.trim() || "Audition";
      rows.push({ label: `${label} · ${formatDate(entry.date)}`, date: new Date(entry.date) });
    }
    if (rows.length === 0) rows.push({ label: "Multiple dates", date: null });
    return rows;
  }

  if (audition.audition_date) {
    rows.push({ label: formatDate(audition.audition_date), date: new Date(audition.audition_date) });
  }
  return rows;
}

function daysUntilDeadline(audition: Audition): number | null {
  const mode = audition.deadline_mode ?? "fixed_date";
  if (mode !== "fixed_date" || !audition.deadline_date) return null;
  const d = new Date(audition.deadline_date);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

function heightSpecs(heights?: AuditionHeightRequirement[]): { k: string; v: string }[] {
  return (heights ?? []).map((h) => {
    const who =
      h.gender === "male"
        ? "Height — male"
        : h.gender === "female"
        ? "Height — female"
        : "Height — all genders";
    const { min_height_cm: min, max_height_cm: max } = h;
    const v =
      min && max
        ? `${min}–${max} cm`
        : min
        ? `≥ ${min} cm`
        : max
        ? `≤ ${max} cm`
        : "Any height";
    return { k: who, v };
  });
}

function truncateUrl(url: string, maxLength = 40): string {
  const stripped = url.replace(/^https?:\/\//, "");
  if (stripped.length <= maxLength) return stripped;
  const start = stripped.slice(0, Math.floor(maxLength * 0.6));
  const end = stripped.slice(stripped.length - Math.floor(maxLength * 0.3));
  return `${start}...${end}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CompanyAuditionSection({ audition, heights, companyName }: Props) {
  if (!audition) return null;

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

  const [descExpanded, setDescExpanded] = useState(false);
  const toggleDescription = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setDescExpanded((v) => !v);
  };

  const status = !isLoggedIn
    ? { label: "Locked", open: false }
    : (() => {
        const s = computeStatus(audition);
        const label = s?.label ?? "Open call";
        return { label, open: label === "Open call" };
      })();

  const deadlineDisplay = getDeadlineDisplay(audition);
  const auditionRows = getAuditionRows(audition);
  const countdown = daysUntilDeadline(audition);
  const specs = heightSpecs(heights);

  const nodes: TimelineNode[] = [];
  if (deadlineDisplay) {
    nodes.push({
      key: "deadline",
      label: "Application deadline",
      value: deadlineDisplay,
      date:
        audition.deadline_mode === "fixed_date" && audition.deadline_date
          ? new Date(audition.deadline_date)
          : null,
      redaction: "lg",
    });
  }
  auditionRows.forEach((row, i) => {
    nodes.push({
      key: `audition-${i}`,
      label:
        audition.audition_schedule_mode === "various_dates" ? "Audition date" : "Audition",
      value: row.label,
      date: row.date,
      redaction: "md",
    });
  });

  const hiddenCount = nodes.length;
  const descriptionText = (audition.description ?? "").trim();
  const hasDescription = descriptionText.length > 0;
  const showDescToggle = hasDescription && descriptionText.length > DESCRIPTION_CLAMP_MIN_CHARS;

  const addToCalendar = (title: string, date: Date) =>
    openCalendarEvent(title, date, audition.description ?? "");

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
      addToCalendar(`Deadline: ${companyName ?? audition.summary ?? "Audition"}`, primaryDate);
    }
  };

  return (
    <View style={styles.wrap} accessible accessibilityRole="summary">
      <View style={styles.frame}>
        {/* Eyebrow + status */}
        <View style={styles.bar}>
          <View style={styles.eyebrow}>
            <Text style={styles.eyebrowIcon}>🩰</Text>
            <Text style={styles.eyebrowText}>Open audition</Text>
          </View>
          <View style={[styles.state, status.open ? styles.stateOpen : styles.stateLocked]}>
            {status.open ? (
              <View style={styles.stateDot} />
            ) : (
              <Ionicons name="lock-closed" size={12} color={Colors.white} />
            )}
            <Text style={styles.stateText}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{audition.summary || "Untitled audition"}</Text>
        {!!audition.location && <Text style={styles.lede}>{audition.location}</Text>}
        {(!!audition.created_at || !!audition.content_updated_at) && (
          <View style={styles.meta}>
            {!!audition.created_at && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={11} color={Colors.grey2} />
                <Text style={styles.metaText}>Posted {formatDate(audition.created_at)}</Text>
              </View>
            )}
            {!!audition.created_at && !!audition.content_updated_at && (
              <View style={styles.metaDot} />
            )}
            {!!audition.content_updated_at && (
              <View style={styles.metaItem}>
                <Ionicons name="create-outline" size={11} color={Colors.grey2} />
                <Text style={styles.metaText}>
                  Updated {formatDate(audition.content_updated_at)}
                </Text>
              </View>
            )}
          </View>
        )}

        {isLoggedIn && countdown !== null && (
          <View style={styles.count}>
            <Text style={styles.countNum}>{countdown}</Text>
            <Text style={styles.countLabel}>
              {countdown === 1 ? "day until the deadline" : "days until the deadline"}
            </Text>
          </View>
        )}

        {/* Dates */}
        {nodes.length > 0 && (
          <View style={[styles.nodes, stacked && styles.nodesStacked]}>
            {nodes.map((node) => (
              <View key={node.key} style={[styles.node, stacked && styles.nodeStacked]}>
                <View style={styles.nodeHead}>
                  <View style={[styles.nodeDot, !isLoggedIn && styles.nodeDotLocked]} />
                  <Text style={styles.nodeLabel}>{node.label}</Text>
                </View>

                {!isLoggedIn ? (
                  <View
                    style={[styles.redaction, { width: REDACTION_WIDTHS[node.redaction] }]}
                  />
                ) : node.date ? (
                  <Pressable
                    onPress={() =>
                      addToCalendar(
                        `${node.label}: ${companyName ?? audition.summary ?? "Audition"}`,
                        node.date!,
                      )
                    }
                    style={styles.nodeValueRow}
                    accessibilityRole="button"
                  >
                    <Text style={styles.nodeValue} numberOfLines={2}>
                      {node.value}
                    </Text>
                    <Ionicons name="calendar-outline" size={13} color={Colors.grey2} />
                  </Pressable>
                ) : (
                  <Text style={styles.nodeValue} numberOfLines={2}>
                    {node.value}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Guest unlock box */}
        {!isLoggedIn && hiddenCount > 0 && (
          <View style={styles.unlock}>
            <View style={styles.unlockIcon}>
              <Ionicons name="lock-closed" size={15} color={Colors.pinkDark} />
            </View>
            <View style={styles.unlockText}>
              <Text style={styles.unlockTitle}>
                {hiddenCount === 1 ? "1 date hidden" : `${hiddenCount} dates hidden`}
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

        {/* Description */}
        {hasDescription && (
          <>
            <Text style={styles.body} numberOfLines={descExpanded ? undefined : 2}>
              {descriptionText}
            </Text>
            {showDescToggle && (
              <Pressable onPress={toggleDescription} accessibilityRole="button">
                <Text style={styles.bodyMore}>{descExpanded ? "View less" : "View more..."}</Text>
              </Pressable>
            )}
          </>
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
              <Ionicons name="mail-outline" size={16} color={Colors.pinkDark} />
              <Text style={styles.newsText}>Never miss an audition — get weekly alerts</Text>
              <Text style={styles.newsArrow}>→</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 46,
  },
  frame: {
    overflow: "hidden",
    borderRadius: 18,
    paddingTop: 26,
    paddingBottom: 28,
    paddingHorizontal: 30,
    backgroundColor: Colors.pinkTint,
    ...Platform.select({
      web: { boxShadow: "0 30px 60px -46px rgba(30,34,44,0.35)" },
      default: {},
    }),
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.pinkBorder,
  },
  eyebrowIcon: {
    fontSize: 13,
  },
  eyebrowText: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "700",
    color: Colors.pinkDark,
  },
  state: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  stateOpen: {
    backgroundColor: Colors.auditionOpenText,
  },
  stateLocked: {
    backgroundColor: Colors.pinkDark,
  },
  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  stateText: {
    fontFamily: INTER,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Colors.white,
  },
  title: {
    marginTop: 22,
    fontFamily: DISPLAY,
    fontWeight: "800",
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.9,
    color: Colors.text,
  },
  lede: {
    marginTop: 10,
    fontFamily: INTER,
    fontSize: 13.5,
    color: Colors.textMuted,
  },
  meta: {
    marginTop: 12,
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
    color: Colors.grey2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.grey2,
    opacity: 0.45,
  },
  count: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 11,
  },
  countNum: {
    fontFamily: DISPLAY,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.pinkDark,
  },
  countLabel: {
    fontFamily: INTER,
    fontSize: 9.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: Colors.grey2,
  },
  nodes: {
    marginTop: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
  },
  nodesStacked: {
    gap: 20,
  },
  node: {
    flexGrow: 1,
    flexBasis: 180,
    gap: 8,
  },
  nodeStacked: {
    flexBasis: "45%",
  },
  nodeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.pink,
  },
  nodeDotLocked: {
    borderColor: Colors.specDivider,
  },
  nodeLabel: {
    fontFamily: INTER,
    fontSize: 9.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: Colors.grey2,
  },
  nodeValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  nodeValue: {
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: Colors.text,
  },
  redaction: {
    height: 16,
    borderRadius: 4,
    backgroundColor: Colors.specDivider,
  },
  unlock: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.pinkBorder,
  },
  unlockIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.pinkTint,
    borderWidth: 1,
    borderColor: Colors.pinkBorder,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9,
    backgroundColor: Colors.pink,
  },
  revealText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },
  specs: {
    marginTop: 30,
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
    paddingVertical: 16,
    paddingHorizontal: 18,
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
    marginTop: 7,
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  body: {
    marginTop: 26,
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: 24,
    color: Colors.textLightDark,
    maxWidth: 730,
  },
  bodyMore: {
    fontFamily: INTER,
    marginTop: 9,
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
  foot: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  primary: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 9,
    backgroundColor: Colors.text,
  },
  primaryText: {
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.white,
  },
  ghost: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 9,
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
  news: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.pinkBorder,
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
    color: Colors.pinkDark,
  },
});
