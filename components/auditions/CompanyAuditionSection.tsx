import { Audition, HeightReq } from "@/types/audition";
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
import { LARGE_SCREEN_BREAKPOINT } from "@/constants/layout"; // ajusta la ruta si hace falta
import { computeStatus } from "@/utils/auditions";
import { Colors } from "@/theme/colors";

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
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return d ?? "—";
  }
}

export default function CompanyAuditionSection({ audition, heights }: Props) {
  if (!audition) return null;

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;

  const [descExpanded, setDescExpanded] = useState(false);
  const status = computeStatus(audition);
  const heightLine = formatHeights(heights);

  const toggleDescription = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setDescExpanded((prev) => !prev);
  };

  const hasDescription = !!(audition as any)?.description;
  const descriptionText = (audition as any)?.description as string | undefined;

  const hasLocation = !!audition.location;
  const hasAuditionDate = !!audition.audition_date;
  const hasDeadline = !!audition.deadline_date;
  const hasEmail = !!audition.email;
  const hasWebsite = !!audition.website_url;
  const hasHeights = !!heightLine;

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

        {/* Dates (deadline first, side by side if both) */}
        {(hasDeadline || hasAuditionDate) && (
          <>
            {hasDeadline && hasAuditionDate ? (
              <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Application deadline</Text>
                  <Text style={[styles.value, styles.textBold]}>
                    {formatDate(audition.deadline_date)}
                  </Text>
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Audition date</Text>
                  <Text style={[styles.value, styles.textBold]}>
                    {formatDate(audition.audition_date)}
                  </Text>
                </View>
              </View>
            ) : hasDeadline ? (
              <View style={styles.row}>
                <Text style={styles.label}>Application deadline</Text>
                <Text style={[styles.value, styles.textBold]}>
                  {formatDate(audition.deadline_date)}
                </Text>
              </View>
            ) : (
              <View style={styles.row}>
                <Text style={styles.label}>Audition date</Text>
                <Text style={[styles.value, styles.textBold]}>
                  {formatDate(audition.audition_date)}
                </Text>
              </View>
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
                      {audition.website_url}
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
                    {audition.website_url}
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
});
