import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { getInitials } from "@/utils/initials";

type IdentityBadgeProps = {
  fullName: string;
  email: string;
  isWide: boolean;
};

/** Black monogram + name + email — a live preview of who is signed in. */
export function IdentityBadge({ fullName, email, isWide }: IdentityBadgeProps) {
  const initials = getInitials(fullName) || getInitials(email);
  const size = isWide ? 72 : 56;

  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.markText, { fontSize: Math.round(size * 0.36) }]}>{initials}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {fullName || "Your name"}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    maxWidth: 360,
  },
  mark: {
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: {
    fontFamily: INTER,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: Colors.white,
  },
  text: {
    flexShrink: 1,
    gap: 3,
  },
  name: {
    fontFamily: INTER,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Colors.text,
  },
  email: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
