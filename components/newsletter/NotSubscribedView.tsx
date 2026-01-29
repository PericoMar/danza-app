import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { styles } from "./styles";

type NotSubscribedViewProps = {
  userEmail?: string | null;
  email: string;
  onEmailChange: (email: string) => void;
  isSubmitting: boolean;
  onSubscribe: () => void;
};

export function NotSubscribedView({
  userEmail,
  email,
  onEmailChange,
  isSubmitting,
  onSubscribe,
}: NotSubscribedViewProps) {
  return (
    <View style={styles.section}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-unread" size={64} color={Colors.purple} />
      </View>
      <Text style={styles.title}>Stay in the Loop</Text>
      <Text style={styles.subtitle}>
        Get notified when new dance auditions are posted. Join thousands of
        dancers who never miss an opportunity.
      </Text>

      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Ionicons name="notifications" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>
            Instant alerts for new auditions
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="trending-up" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>
            Company updates & industry news
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="gift" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>Exclusive tips & resources</Text>
        </View>
      </View>

      {!userEmail && (
        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={Colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />
        </View>
      )}

      {userEmail && (
        <View style={styles.loggedInEmail}>
          <Ionicons name="mail" size={20} color={Colors.purple} />
          <Text style={styles.loggedInEmailText}>{userEmail}</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.subscribeButton,
          pressed && styles.subscribeButtonPressed,
          isSubmitting && styles.buttonDisabled,
        ]}
        onPress={onSubscribe}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.privacyNote}>
        We respect your privacy. Unsubscribe anytime.
      </Text>
    </View>
  );
}
