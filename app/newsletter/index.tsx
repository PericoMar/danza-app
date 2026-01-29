import { View, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import { useAuth } from "@/app/_layout";
import Snackbar from "@/components/Snackbar";
import { useNewsletter } from "@/hooks/useNewsletter";
import {
  SubscribedView,
  NotSubscribedView,
  newsletterStyles as styles,
} from "@/components/newsletter";
import { Colors } from "@/theme/colors";
import { MOBILE_BREAKPOINT } from "@/constants/layout";

export default function NewsletterScreen() {
  const { session } = useAuth();
  const userEmail = session?.user?.email;
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const {
    status,
    email,
    setEmail,
    isSubmitting,
    snackbar,
    clearSnackbar,
    handleSubscribe,
    handleUnsubscribe,
  } = useNewsletter({ userEmail });

  if (status === "loading") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={4000}
          onClose={clearSnackbar}
        />
      )}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          !isMobile && styles.containerDesktop,
        ]}
      >
        <View style={styles.content}>
          {status === "subscribed" ? (
            <SubscribedView
              userEmail={userEmail!}
              isSubmitting={isSubmitting}
              onUnsubscribe={handleUnsubscribe}
              status={status}
            />
          ) : (
            <NotSubscribedView
              userEmail={userEmail}
              email={email}
              onEmailChange={setEmail}
              isSubmitting={isSubmitting}
              onSubscribe={handleSubscribe}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
