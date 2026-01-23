import { Audition, HeightReq, AuditionScheduleEntry } from "@/types/audition";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  Linking,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LARGE_SCREEN_BREAKPOINT } from "@/constants/layout";
import { computeStatus } from "@/utils/auditions";
import { Colors } from "@/theme/colors";
import { useAuth } from "@/app/_layout";
import { useRouter } from "expo-router";

type Props = {
  audition: Audition | null;
  heights?: HeightReq[];
};

function formatHeights(heights?: HeightReq[]) {
  if (!heights || heights.length === 0) return "";
  return heights
    .map((h) => {
      const genderLabel =
        h.gender === "male"
          ? "♂ Male"
          : h.gender === "female"
          ? "♀ Female"
          : "All genders";

      const min = h.min_height_cm ?? null;
      const max = h.max_height_cm ?? null;

      if (min && max) return `${genderLabel}: ${min}–${max} cm`;
      if (min && !max) return `${genderLabel}: ≥ ${min} cm`;
      if (!min && max) return `${genderLabel}: ≤ ${max} cm`;
      return `${genderLabel}: —`;
    })
    .join("   •   ");
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return d ?? "—";
  }
}

// ---- NUEVA LÓGICA DE FECHAS / MODOS ----

function getDeadlineDisplay(audition: Audition): string | null {
  const mode = audition.deadline_mode ?? "fixed_date";

  if (mode === "asap") return "ASAP";
  if (mode === "always_open") return "Always open";

  if (audition.deadline_date) {
    return formatDate(audition.deadline_date);
  }

  return null;
}

/**
 * Devuelve las filas de "Audition" ya listas para pintar.
 * Para various_dates → ["Label - 01/02/2025", ...]
 * Para to_be_arranged → [texto o "To be arranged"]
 * Para single_date → [fecha formateada]
 */
function getAuditionRows(audition: Audition): string[] {
  const rows: string[] = [];
  const mode = audition.audition_schedule_mode ?? (audition.audition_date ? "single_date" : null);

  if (mode === "to_be_arranged") {
    const note = audition.audition_schedule_note?.trim();
    rows.push(note && note.length > 0 ? note : "To be arranged");
    return rows;
  }

  if (mode === "various_dates") {
    const entries = (audition.audition_schedule_entries ??
      []) as AuditionScheduleEntry[];

    for (const entry of entries) {
      if (!entry.date) continue;
      const label = entry.label?.trim() || "Audition";
      rows.push(`${label} - ${formatDate(entry.date)}`);
    }

    if (rows.length === 0) {
      // Sin fechas válidas, al menos indicamos que hay varias
      rows.push("Multiple dates");
    }

    return rows;
  }

  // single_date o legacy
  if (audition.audition_date) {
    rows.push(formatDate(audition.audition_date));
  }

  return rows;
}

function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;

  // Remove protocol for display
  let displayUrl = url.replace(/^https?:\/\//, '');

  if (displayUrl.length <= maxLength) return displayUrl;

  // Truncate from the middle, keeping domain and end
  const start = displayUrl.substring(0, Math.floor(maxLength * 0.6));
  const end = displayUrl.substring(displayUrl.length - Math.floor(maxLength * 0.3));
  return `${start}...${end}`;
}

export default function CompanyAuditionSection({ audition, heights }: Props) {
  if (!audition) return null;

  const { session } = useAuth();
  const isLoggedIn = !!session;
  const router = useRouter();

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;

  const [descExpanded, setDescExpanded] = useState(false);

  // Override status when user is not logged in
  const actualStatus = computeStatus(audition);
  const status = !isLoggedIn
    ? { label: "Locked", bgColor: Colors.purpleLight, textColor: Colors.purple }
    : actualStatus;

  const heightLine = formatHeights(heights);

  console.log("Height line:", heightLine);

  const toggleDescription = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setDescExpanded((prev) => !prev);
  };

  const hasDescription = !!(audition as any)?.description;
  const descriptionText = (audition as any)?.description as string | undefined;

  const hasLocation = !!audition.location;
  const hasEmail = !!audition.email;
  const hasWebsite = !!audition.website_url;
  const hasHeights = !!heightLine;

  // NUEVO: deadline / audition basados en modos
  const deadlineDisplay = getDeadlineDisplay(audition);
  const auditionRows = getAuditionRows(audition);
  const hasDeadlineInfo = !!deadlineDisplay;
  const hasAuditionInfo = auditionRows.length > 0;

  return (
    <View style={styles.section} accessible accessibilityRole="summary">
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>🩰 AUDITION</Text>

          {status && (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: status.bgColor },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: status.textColor }]}
              />
              <Text style={[styles.statusText, { color: status.textColor }]}>
                {status.label}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.row}>
          <Text style={styles.mainTitle}>
            {audition.summary || "Untitled audition"}
          </Text>
        </View>

        {/* Location + Heights (responsive) */}
        {hasLocation && hasHeights && (
          <View style={isLargeScreen ? styles.inlineRow : styles.stackedRow}>
            <View style={[styles.inlineItemHalf, !isLargeScreen && styles.fullWidth]}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationRow}>
                <Ionicons
                  name="pin-outline"
                  size={18}
                  style={styles.locationIcon}
                />
                <Text style={styles.value}>{audition.location}</Text>
              </View>
            </View>
            <View style={[styles.inlineItemHalf, !isLargeScreen && styles.fullWidth]}>
              <Text style={styles.label}>Height requirements</Text>
              <Text style={styles.value}>{heightLine}</Text>
            </View>
          </View>
        )}

        {hasLocation && !hasHeights && (
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="pin-outline"
                size={18}
                style={styles.locationIcon}
              />
              <Text style={styles.value}>{audition.location}</Text>
            </View>
          </View>
        )}

        {!hasLocation && hasHeights && (
          <View style={styles.row}>
            <Text style={styles.label}>Height requirements</Text>
            <Text style={styles.value}>{heightLine}</Text>
          </View>
        )}

        {/* Dates (deadline + audition con la nueva estructura) */}
        {(hasDeadlineInfo || hasAuditionInfo) && (
          <>
            {!isLoggedIn ? (
              // Locked state - show login prompt
              <View style={styles.lockedDatesContainer}>
                <View style={styles.lockedHeader}>
                  <Ionicons name="lock-closed" size={16} color={Colors.purple} />
                  <Text style={styles.lockedTitle}>
                    Dates are locked
                  </Text>
                </View>
                <View style={styles.lockedMessageContainer}>
                  <Text style={styles.lockedMessage}>
                    To view application deadline and audition dates, please: {" "}
                  </Text>
                  <Pressable
                    onPress={() => router.push("/login" as any)}
                    accessibilityRole="link"
                  >
                    {({ hovered, pressed }) => (
                      <Text
                        style={[
                          styles.loginLinkText,
                          hovered && styles.loginLinkTextHovered,
                          pressed && styles.loginLinkPressed,
                        ]}
                      >
                        Log in
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {isLargeScreen && hasDeadlineInfo && hasAuditionInfo ? (
                  // En pantallas grandes, dos columnas
                  <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.label}>Application deadline</Text>
                      <Text style={[styles.value, styles.textBold]}>
                        {deadlineDisplay}
                      </Text>
                    </View>

                    <View style={styles.dateCol}>
                      <Text style={styles.label}>
                        {audition.audition_schedule_mode === "various_dates"
                          ? "Audition dates"
                          : "Audition"}
                      </Text>
                      {auditionRows.map((row, i) => (
                        <Text
                          key={i}
                          style={[styles.value, styles.textBold]}
                          numberOfLines={1}
                        >
                          {row}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : (
                  // En pantallas pequeñas o cuando solo hay uno de los dos
                  <>
                    {hasDeadlineInfo && (
                      <View style={styles.row}>
                        <Text style={styles.label}>Application deadline</Text>
                        <Text style={[styles.value, styles.textBold]}>
                          {deadlineDisplay}
                        </Text>
                      </View>
                    )}

                    {hasAuditionInfo && (
                      <View style={styles.row}>
                        <Text style={styles.label}>
                          {audition.audition_schedule_mode === "various_dates"
                            ? "Audition dates"
                            : "Audition"}
                        </Text>
                        {auditionRows.map((row, i) => (
                          <Text
                            key={i}
                            style={[styles.value, styles.textBold]}
                          >
                            {row}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Description */}
        {hasDescription && descriptionText && (
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text
              style={styles.value}
              numberOfLines={descExpanded ? undefined : 2}
            >
              {descriptionText}
            </Text>

            {descriptionText.length > 140 && (
              <Pressable
                onPress={toggleDescription}
                style={styles.viewMoreButton}
                accessibilityRole="button"
              >
                <Text style={styles.viewMoreText}>
                  {descExpanded ? "View less" : "View more..."}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Contact + Website (responsive) */}
        {hasEmail && hasWebsite && (
          <View style={isLargeScreen ? styles.inlineRow : styles.stackedRow}>
            <View style={[styles.inlineItemHalf, !isLargeScreen && styles.fullWidth]}>
              <Text style={styles.label}>Contact email</Text>
              <Text style={styles.value}>{audition.email}</Text>
            </View>

            <View
              style={[
                styles.inlineItemHalf,
                styles.websiteContainer,
                !isLargeScreen && styles.fullWidth,
              ]}
            >
              <Text style={styles.label}>Website</Text>
              <Pressable
                onPress={() => Linking.openURL(audition.website_url!)}
                accessibilityRole="link"
              >
                {({ hovered }) => (
                  <View
                    style={[
                      styles.linkPressable,
                      hovered && styles.linkPressableHovered,
                    ]}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        hovered && styles.linkTextHovered,
                      ]}
                    >
                      {truncateUrl(audition.website_url!)}
                    </Text>
                    <Text
                      style={[
                        styles.linkIcon,
                        hovered && styles.linkTextHovered,
                      ]}
                    >
                      ↗
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {hasEmail && !hasWebsite && (
          <View style={styles.row}>
            <Text style={styles.label}>Contact email</Text>
            <Text style={styles.value}>{audition.email}</Text>
          </View>
        )}

        {!hasEmail && hasWebsite && (
          <View style={[styles.row, styles.websiteContainer]}>
            <Text style={styles.label}>Website</Text>
            <Pressable
              onPress={() => Linking.openURL(audition.website_url!)}
              accessibilityRole="link"
            >
              {({ hovered }) => (
                <View
                  style={[
                    styles.linkPressable,
                    hovered && styles.linkPressableHovered,
                  ]}
                >
                  <Text
                    style={[
                      styles.linkText,
                      hovered && styles.linkTextHovered,
                    ]}
                  >
                    {truncateUrl(audition.website_url!)}
                  </Text>
                  <Text
                    style={[
                      styles.linkIcon,
                      hovered && styles.linkTextHovered,
                    ]}
                  >
                    ↗
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Newsletter Promo */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.newsletterBanner,
            hovered && styles.newsletterBannerHovered,
            pressed && styles.newsletterBannerPressed,
          ]}
          onPress={() => router.push("/newsletter" as any)}
          accessibilityRole="link"
          accessibilityLabel="Subscribe to newsletter"
        >
          <Ionicons name="mail-outline" size={16} color={Colors.purple} />
          <Text style={styles.newsletterText}>
            Never miss an audition — <Text style={styles.newsletterLink}>get alerts in your inbox</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.auditionBgColor,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#111827",
    textTransform: "uppercase",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  statusPill: {
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  mainTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  row: {
    flexDirection: "column",
    gap: 3,
  },
  inlineRow: {
    flexDirection: "row",
    columnGap: 16,
    rowGap: 8,
    flexWrap: "wrap",
  },
  inlineItemHalf: {
    flex: 1,
    minWidth: 150,
    gap: 2,
  },
  stackedRow: {
    flexDirection: "column",
    rowGap: 8,
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#4B5563",
  },
  value: {
    fontSize: 13,
    color: "#111827",
    flexWrap: "wrap",
  },
  textBold: {
    fontWeight: "600",
    fontSize: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  locationIcon: {
    color: "#0F172A",
    marginTop: 1,
  },
  datesRow: {
    flexDirection: "row",
    columnGap: 16,
  },
  dateCol: {
    flex: 1,
    gap: 2,
  },
  viewMoreButton: {
    marginTop: 2,
    alignSelf: "flex-start",
  },
  viewMoreText: {
    fontSize: 12,
    color: "#0369A1",
    textDecorationLine: "underline",
  },
  websiteContainer: {
    alignItems: "flex-start",
  },
  linkPressable: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    ...(Platform.OS === "web" ? { cursor: "pointer" as any } : {}),
  },
  linkPressableHovered: {
    // wrapper hover (por si quieres jugar con fondo, etc.)
  },
  linkText: {
    fontSize: 13,
    color: "#1F2937",
    textDecorationLine: "underline",
  },
  linkTextHovered: {
    color: "#2563EB",
  },
  linkIcon: {
    fontSize: 11,
    color: "#4B5563",
  },
  lockedDatesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.purpleSoft,
    borderStyle: "dashed",
  },
  lockedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockedTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.purple,
  },
  lockedMessage: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  lockedMessageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 13,
    color: "#2563EB",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  loginLinkTextHovered: {
    color: "#1D4ED8",
  },
  loginLinkPressed: {
    opacity: 0.6,
  },
  newsletterBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(119, 85, 255, 0.2)",
    ...(Platform.OS === "web" ? { cursor: "pointer" as any } : {}),
  },
  newsletterBannerHovered: {
    backgroundColor: "rgba(119, 85, 255, 0.05)",
    borderColor: Colors.purple,
  },
  newsletterBannerPressed: {
    opacity: 0.8,
  },
  newsletterText: {
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  },
  newsletterLink: {
    color: Colors.purple,
    fontWeight: "600",
  },
});
