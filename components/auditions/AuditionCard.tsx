// components/auditions/AuditionCard.tsx
import React from "react";
import { View, Text, Pressable, Linking, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AuditionDeleteButton from "@/components/auditions/AuditionDeleteButton";
import FeaturedAuditionTag from "@/components/auditions/FeaturedAuditionTag";
import { Audition } from "@/types/audition";
import { getStatusBadge } from "@/utils/auditions";
import {
  AuditionSpec,
  getAgeSpecs,
  getApplicationLinkRows,
  getAuditionDateRows,
  getContactEmailRows,
  getDeadlineRows,
  getHeightSpecs,
  getPlacesSummary,
} from "@/utils/auditionDisplay";
import { Colors } from "@/theme/colors";
import { DISPLAY, INTER } from "@/theme/companies";

type Props = {
  audition: Audition;
  isFeatured?: boolean;
  onEdit?: (audition: Audition) => void;
  onDeleted?: (auditionId: string) => void;
  onDeleteError?: (message: string) => void;
};

const WEB_POINTER = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;
const LOCATION_LINE_HEIGHT = 18;
const LOCATION_ICON_SIZE = 13;

const withNotes = (text: string, notes: string | null) => (notes ? `${text} · ${notes}` : text);

// The admin sees every deadline and date, labels and notes included.
function buildSpecs(audition: Audition): AuditionSpec[] {
  const deadlines = getDeadlineRows(audition).map((r) => withNotes(r.text, r.notes));
  const dates = getAuditionDateRows(audition).map((r) => withNotes(`${r.when} · ${r.place}`, r.notes));
  const heightSpecs = getHeightSpecs(audition.height_requirements);
  const ageSpecs = getAgeSpecs(audition);
  return [
    ...(audition.schedule_label ? [{ k: "Schedule label", v: audition.schedule_label }] : []),
    { k: deadlines.length > 1 ? "Deadlines" : "Deadline", v: deadlines.join("\n") || "—" },
    { k: dates.length > 1 ? "Auditions" : "Audition", v: dates.join("\n") || "—" },
    ...(heightSpecs.length ? heightSpecs : [{ k: "Height", v: "No requirements" }]),
    ...(ageSpecs.length ? ageSpecs : [{ k: "Age", v: "No limit" }]),
  ];
}

function StatusPill({ audition }: { audition: Audition }) {
  const status = getStatusBadge(audition);
  const textColor = status?.textColor ?? Colors.grey2;
  return (
    <View style={[styles.status, { backgroundColor: status?.bgColor ?? Colors.chromeSoft }]}>
      <View style={[styles.statusDot, { backgroundColor: textColor }]} />
      <Text style={[styles.statusText, { color: textColor }]}>{status?.label ?? "No dates"}</Text>
    </View>
  );
}

/** Admin-only marker: the audition is switched off and hidden from the company page. */
function InactiveTag() {
  return (
    <View style={[styles.status, styles.inactive]} accessibilityLabel="Inactive: hidden from the company page">
      <Ionicons name="eye-off-outline" size={11} color={Colors.grey2} />
      <Text style={[styles.statusText, { color: Colors.grey2 }]}>Inactive</Text>
    </View>
  );
}

export default function AuditionCard({
  audition,
  isFeatured = false,
  onEdit,
  onDeleted,
  onDeleteError,
}: Props) {
  const specs = buildSpecs(audition);
  const places = getPlacesSummary(audition);
  const applyLinks = getApplicationLinkRows(audition);
  const emails = getContactEmailRows(audition);

  return (
    <View
      style={[styles.card, isFeatured && styles.cardFeatured]}
      accessibilityLabel={`Audition ${audition.summary || "untitled"}${isFeatured ? ", featured" : ""}`}
    >
      <View style={styles.top}>
        <View style={styles.tags}>
          <StatusPill audition={audition} />
          {!audition.is_active && <InactiveTag />}
          {isFeatured && <FeaturedAuditionTag />}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => onEdit?.(audition)}
            accessibilityRole="button"
            accessibilityLabel="Edit audition"
            style={({ hovered }) => [styles.editBtn, WEB_POINTER, hovered && styles.editBtnHovered]}
          >
            <Ionicons name="pencil" size={13} color={Colors.text} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <AuditionDeleteButton audition={audition} onDeleted={onDeleted} onError={onDeleteError} />
        </View>
      </View>

      <Text style={styles.title} numberOfLines={3}>
        {audition.summary || "Untitled audition"}
      </Text>
      {!!places && (
        <View style={styles.location}>
          <Ionicons
            name="location-outline"
            size={LOCATION_ICON_SIZE}
            color={Colors.textMuted}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>{places}</Text>
        </View>
      )}

      <View style={styles.specs}>
        {specs.map((s, i) => (
          <View key={`${s.k}-${i}`} style={styles.spec}>
            <Text style={styles.specKey}>{s.k}</Text>
            <Text style={styles.specValue}>{s.v}</Text>
          </View>
        ))}
      </View>

      {applyLinks.length > 0 && (
        <View style={styles.contact}>
          <Text style={styles.specKey}>Apply</Text>
          {applyLinks.map((link) => (
            <Pressable
              key={link.key}
              onPress={() => Linking.openURL(link.url)}
              accessibilityRole="link"
              accessibilityLabel={`Application link: ${link.text}, opens ${link.host}`}
              style={[styles.contactItem, WEB_POINTER]}
            >
              <Ionicons name="open-outline" size={13} color={Colors.grey2} />
              <Text style={[styles.contactText, styles.link]}>{link.text}</Text>
              {link.text !== link.host && <Text style={styles.contactNote}>{link.host}</Text>}
            </Pressable>
          ))}
        </View>
      )}

      {(emails.length > 0 || !!audition.website_url) && (
        <View style={styles.contact}>
          {emails.map((email) => (
            <View key={email.key} style={styles.contactItem}>
              <Ionicons name="mail-outline" size={13} color={Colors.grey2} />
              <Text style={styles.contactText} selectable>
                {email.email}
              </Text>
              {!!email.label && <Text style={styles.contactNote}>{email.label}</Text>}
            </View>
          ))}
          {!!audition.website_url && (
            <Pressable
              onPress={() => Linking.openURL(audition.website_url!)}
              accessibilityRole="link"
              style={[styles.contactItem, WEB_POINTER]}
            >
              <Ionicons name="globe-outline" size={13} color={Colors.grey2} />
              <Text style={[styles.contactText, styles.link]}>Website ↗</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  cardFeatured: {
    borderColor: Colors.text,
    ...Platform.select({
      web: { boxShadow: "0 18px 42px -22px rgba(0,0,0,.18)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
        elevation: 3,
      },
    }),
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  tags: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  inactive: {
    backgroundColor: Colors.chromeSoft,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: INTER,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    backgroundColor: Colors.white,
  },
  editBtnHovered: {
    borderColor: Colors.text,
  },
  editText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Colors.text,
  },
  // A long list of places wraps onto more lines, with the pin on the first one.
  location: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: -6,
  },
  locationIcon: {
    marginTop: (LOCATION_LINE_HEIGHT - LOCATION_ICON_SIZE) / 2,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: LOCATION_LINE_HEIGHT,
    color: Colors.textMuted,
  },
  // 1px gap over a specDivider background draws the grid lines between cells.
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    backgroundColor: Colors.specDivider,
    borderWidth: 1,
    borderColor: Colors.specDivider,
    borderRadius: 10,
    overflow: "hidden",
  },
  spec: {
    flexGrow: 1,
    flexBasis: 160,
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.specSurface,
  },
  specKey: {
    fontFamily: INTER,
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: Colors.grey2,
  },
  specValue: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: Colors.text,
  },
  contact: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 18,
    rowGap: 6,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.grey1,
  },
  link: {
    textDecorationLine: "underline",
  },
  // What a contact is: a link's site, an email's label.
  contactNote: {
    fontFamily: INTER,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
