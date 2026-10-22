import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "@/app/_layout";
import { useNewsletter } from "@/hooks/useNewsletter";
import { hasSubscribed } from "@/types/newsletter";
import {
  SubscribedView,
  NotSubscribedView,
  newsletterStyles as styles,
  newsletterColors as NL,
} from "@/components/newsletter";
import { loadCompaniesFonts, pageHPadding } from "@/theme/companies";
import { NEWSLETTER_CONTENT_MAX_WIDTH, TABLET_BREAKPOINT } from "@/constants/layout";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import BackLink from "@/components/ui/BackLink";
import { COMPANIES_ROUTE } from "@/constants/routes";

export default function NewsletterScreen() {
  const { session } = useAuth();
  const userEmail = session?.user?.email;
  const { width } = useWindowDimensions();
  const isSplit = width >= TABLET_BREAKPOINT;

  useEffect(() => {
    loadCompaniesFonts();
  }, []);

  const {
    status,
    email,
    setEmail,
    isSubmitting,
    handleSubscribe,
    handleUnsubscribe,
    emailSuggestion,
    acceptEmailSuggestion,
  } = useNewsletter({ userEmail });

  // Which panel is actually painted. It lags `status` by one fade so the old
  // copy can animate out before the new copy (and its staggered entrance) plays.
  const [shownStatus, setShownStatus] = useState(status);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "loading" || status === shownStatus) return;

    // First resolve after the loading spinner — snap in, no cross-fade.
    if (shownStatus === "loading") {
      setShownStatus(status);
      return;
    }

    Animated.timing(fade, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setShownStatus(status);
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [status, shownStatus, fade]);

  // The address to confirm — the session email, or whatever the anon user typed.
  const confirmEmail = userEmail ?? email;

  if (status === "loading" || shownStatus === "loading") {
    return (
      <View style={styles.screen}>
        <SiteHeader />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={NL.ink} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SiteHeader />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: pageHPadding(width),
            paddingTop: isSplit ? 96 : 56,
            paddingBottom: isSplit ? 96 : 56,
          },
        ]}
      >
        {!isSplit && (
          <View style={[styles.backLink, { left: pageHPadding(width) }]}>
            <BackLink fallbackHref={COMPANIES_ROUTE} />
          </View>
        )}

        <Animated.View
          style={[styles.wrap, { maxWidth: NEWSLETTER_CONTENT_MAX_WIDTH, opacity: fade }]}
        >
          {hasSubscribed(shownStatus) ? (
            <SubscribedView
              userEmail={confirmEmail}
              isSubmitting={isSubmitting}
              onUnsubscribe={handleUnsubscribe}
              status={shownStatus}
              isSplit={isSplit}
              canUnsubscribe={!!userEmail}
            />
          ) : (
            <NotSubscribedView
              userEmail={userEmail}
              email={email}
              onEmailChange={setEmail}
              isSubmitting={isSubmitting}
              onSubscribe={handleSubscribe}
              isSplit={isSplit}
              suggestion={emailSuggestion}
              onAcceptSuggestion={acceptEmailSuggestion}
            />
          )}
        </Animated.View>
      </ScrollView>
      <SiteFooter />
    </View>
  );
}
