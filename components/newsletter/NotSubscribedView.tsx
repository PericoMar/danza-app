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
        Get one email every Sunday summarizing all the auditions posted during the week. Join other dancers who never miss an opportunity.
      </Text>

      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Ionicons name="time-outline" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>
            Quick one minute read email. No unnecessary noise
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="notifications" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>
            Only one email per week. No Spam
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="trending-up" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>
            Direct links to each audition so you don't waste time looking for them
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="gift" size={20} color={Colors.purple} />
          <Text style={styles.benefitText}>Easy and free</Text>
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
