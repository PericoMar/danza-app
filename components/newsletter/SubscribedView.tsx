import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NL, styles, heroFontSize } from "./styles";
import { useSubscribedAnimation } from "@/hooks/useSubscribedAnimation";
import type { SubscriptionStatus } from "@/types/newsletter";
import { NewsletterBenefits, type Benefit } from "./NewsletterBenefits";

type SubscribedViewProps = {
  userEmail: string;
  isSubmitting: boolean;
  onUnsubscribe: () => void;
  status: SubscriptionStatus;
  isSplit: boolean;
  /**
   * Whether to offer the in-page unsubscribe. Only true for a signed-in account —
   * anonymous subscribers have no session to act on and unsubscribe via the link
   * in the email instead.
   */
  canUnsubscribe: boolean;
};

const RECEIVES: Benefit[] = [
  { icon: "notifications", text: "New audition alerts, straight to your inbox" },
  { icon: "time-outline", text: "A quick and easy read — one minute, tops" },
  { icon: "gift", text: "Exclusive offers for dancers" },
];

export function SubscribedView({
  userEmail,
  isSubmitting,
  onUnsubscribe,
  status,
  isSplit,
  canUnsubscribe,
}: SubscribedViewProps) {
  const { width } = useWindowDimensions();
  const isWide = isSplit;
  const heroSize = heroFontSize(width, isWide);

  const {
    markScale,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    panelOpacity,
    panelTranslateY,
  } = useSubscribedAnimation(status);

  return (
    <View style={styles.wrap}>
      <View style={[styles.eyebrow, !isWide && styles.eyebrowCentered]}>
        <Animated.View
          style={[styles.successMark, { transform: [{ scale: markScale }] }]}
        >
          <Ionicons name="checkmark" size={13} color={NL.bg} />
        </Animated.View>
        <Text style={styles.eyebrowText}>Subscribed</Text>
      </View>

      <Animated.Text
        style={[
          styles.title,
          !isWide && styles.titleCentered,
          { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.04) },
          { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
        ]}
        accessibilityRole="header"
      >
        You're all set.
      </Animated.Text>

      <Animated.Text
        style={[
          styles.subtitle,
          isWide ? styles.subtitleWide : styles.subtitleCompact,
          { opacity: subtitleOpacity },
        ]}
      >
        You'll receive audition alerts at{" "}
        <Text style={styles.emailHighlight}>{userEmail}</Text>
      </Animated.Text>

      <Animated.View
        style={{
          width: "100%",
          opacity: panelOpacity,
          transform: [{ translateY: panelTranslateY }],
        }}
      >
        <NewsletterBenefits items={RECEIVES} isWide={isWide} />

        {canUnsubscribe && (
          <View style={styles.unsubscribeBlock}>
            <Text
              style={[
                styles.unsubscribeLabel,
                !isWide && styles.unsubscribeLabelCentered,
              ]}
            >
              Want to stop receiving emails?
            </Text>
            <Pressable
              style={[
                styles.unsubscribeButton,
                !isWide && styles.unsubscribeButtonCentered,
              ]}
              onPress={onUnsubscribe}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={NL.muted} />
              ) : (
                <Text style={styles.unsubscribeButtonText}>Unsubscribe</Text>
              )}
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
