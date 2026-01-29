import { View, Text, Pressable, ActivityIndicator, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { useSubscribedAnimation } from "@/hooks/useSubscribedAnimation";
import type { SubscriptionStatus } from "@/types/newsletter";
import { styles } from "./styles";

type SubscribedViewProps = {
  userEmail: string;
  isSubmitting: boolean;
  onUnsubscribe: () => void;
  status: SubscriptionStatus;
};

export function SubscribedView({
  userEmail,
  isSubmitting,
  onUnsubscribe,
  status,
}: SubscribedViewProps) {
  const {
    checkmarkScale,
    checkmarkRotate,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    benefitsOpacity,
    benefitsTranslateY,
    pulseAnim,
  } = useSubscribedAnimation(status);

  return (
    <View style={styles.section}>
      {/* Animated checkmark icon */}
      <Animated.View
        style={[
          styles.iconContainerSubscribed,
          {
            transform: [
              { scale: Animated.multiply(checkmarkScale, pulseAnim) },
              {
                rotate: checkmarkRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-15deg", "0deg"],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.iconInnerGlow} />
        <Ionicons name="checkmark-circle" size={72} color={Colors.purple} />
      </Animated.View>

      {/* Animated title */}
      <Animated.Text
        style={[
          styles.titleSubscribed,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        You're subscribed! 🎉
      </Animated.Text>

      {/* Animated subtitle */}
      <Animated.Text
        style={[styles.subtitleSubscribed, { opacity: subtitleOpacity }]}
      >
        You'll receive audition alerts at{"\n"}
        <Text style={styles.emailHighlight}>{userEmail}</Text>
      </Animated.Text>

      {/* Animated benefits */}
      <Animated.View
        style={[
          styles.benefitsCard,
          {
            opacity: benefitsOpacity,
            transform: [{ translateY: benefitsTranslateY }],
          },
        ]}
      >
        <Text style={styles.benefitsCardTitle}>What you'll receive:</Text>
        <View style={styles.benefitItemSubscribed}>
          <View style={styles.benefitIconCircle}>
            <Ionicons name="notifications" size={18} color="#fff" />
          </View>
          <Text style={styles.benefitTextSubscribed}>
            New audition alerts
          </Text>
        </View>
        <View style={styles.benefitItemSubscribed}>
          <View style={styles.benefitIconCircle}>
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <Text style={styles.benefitTextSubscribed}>
            Early access to opportunities
          </Text>
        </View>
        <View style={styles.benefitItemSubscribed}>
          <View style={styles.benefitIconCircle}>
            <Ionicons name="heart" size={18} color="#fff" />
          </View>
          <Text style={styles.benefitTextSubscribed}>
            Exclusive content for dancers
          </Text>
        </View>
      </Animated.View>

      <View style={styles.divider} />

      <Text style={styles.unsubscribeLabel}>
        Want to stop receiving emails?
      </Text>
      <Pressable
        style={styles.unsubscribeButton}
        onPress={onUnsubscribe}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        ) : (
          <Text style={styles.unsubscribeButtonText}>Unsubscribe</Text>
        )}
      </Pressable>
    </View>
  );
}
