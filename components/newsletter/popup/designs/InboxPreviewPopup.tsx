import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { SMALL_SCREEN_BREAKPOINT } from "@/constants/layout";
import {
  NEWSLETTER_POPUP_SAMPLE_AUDITIONS,
  NewsletterPopupCloseReason,
} from "@/constants/newsletterPopup";
import { AuditionStatus, type AuditionWithCompany } from "@/types/audition";
import { useAuditions } from "@/hooks/useAuditions";
import { usePopupPresence } from "@/hooks/usePopupPresence";
import {
  cardLabel,
  formatShortDate,
  getHeadlineAuditionDate,
  getHeadlineDeadline,
} from "@/utils/auditionDisplay";
import { prefersReducedMotion } from "@/utils/motion";
import { NL } from "../../styles";
import { EmailSuggestion } from "../../EmailSuggestion";
import { ValidatingNotice } from "../../ValidatingNotice";
import { PopupConsent } from "../PopupConsent";
import { PopupError } from "../PopupError";
import { CloseButton } from "@/components/common/CloseButton";
import { POPUP_EMAIL_INPUT_PROPS, POPUP_EMAIL_PLACEHOLDER } from "../emailInput";
import type { NewsletterPopupViewProps } from "../types";

const FIELD_HEIGHT = 52;
const SUBMIT_SIZE = 40;
const STATUS_DOT_SIZE = 7;
const ROW_STAGGER_MS = 70;
const ROW_ENTER_MS = 260;
// Lets the card land before the rows start arriving.
const ROWS_DELAY_MS = 150;
// specSurface at zero alpha, so the bottom fade melts into the panel.
const PANEL_FADE_TOP = "rgba(250,250,251,0)";
// Uneven widths read as text rather than as a striped bar.
const SKELETON_NAME_WIDTHS = ["62%", "48%", "56%"] as const;

const STATUS_DOT_COLOR: Record<AuditionStatus, string> = {
  [AuditionStatus.OPEN_CALL]: Colors.auditionOpen,
  [AuditionStatus.POST_DEADLINE]: Colors.auditionSoon,
  [AuditionStatus.PAST]: Colors.auditionClosed,
};

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

/** The date a sample row leads with: the deadline while it's open, the audition after. */
function sampleRowDate(audition: AuditionWithCompany): string {
  if (audition.schedule_label) return cardLabel(audition.schedule_label);
  const deadline = getHeadlineDeadline(audition);
  if (audition.status === AuditionStatus.OPEN_CALL && deadline) {
    return `Deadline ${deadline.date_label ? cardLabel(deadline.date_label) : formatShortDate(deadline.date)}`;
  }
  const date = getHeadlineAuditionDate(audition);
  if (!date) return "";
  return `Audition ${date.date_label ? cardLabel(date.date_label) : formatShortDate(date.start_date)}`;
}

/**
 * "Show, don't tell": the popup opens on a preview of the Sunday email itself,
 * filled with this week's real auditions.
 */
export function InboxPreviewPopup({
  form,
  onClose,
  onOpenPrivacyPolicy,
  onCreateAccount,
  autoCloseAfterSuccessMs,
}: NewsletterPopupViewProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;
  const isGuest = !form.lockedEmail;
  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const titleStyle = [styles.title, isSmallScreen && styles.titleSmall];

  return (
    <>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => close()}
          accessibilityRole="button"
          accessibilityLabel="Close newsletter popup"
        />
      </Animated.View>

      <View style={styles.centeredContainer}>
        {/* Scale on a borderless wrapper: iOS doesn't resize a bordered view's
            background along with its scale. */}
        <Animated.View style={[styles.frame, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
            <View style={styles.topBar}>
              <View style={styles.eyebrow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowText}>Audition alerts</Text>
              </View>
              <CloseButton onPress={() => close()} />
            </View>

            <EmailPreview isSubscribed={form.isSubscribed} />

            {form.isSubscribed ? (
              <View style={styles.copy}>
                <Text style={titleStyle} accessibilityRole="header">
                  See you Sunday.
                </Text>
                <Text style={styles.body}>
                  First email goes to{" "}
                  <Text style={styles.emailHighlight}>{form.subscribedEmail}</Text>.
                </Text>
                {form.isValidating && <ValidatingNotice />}
                {isGuest && (
                  <Pressable
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.registerButton,
                      webPointer,
                      hovered && styles.registerButtonHovered,
                    ]}
                    onPress={() => {
                      close(NewsletterPopupCloseReason.DONE);
                      onCreateAccount();
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.registerButtonText}>Create an account</Text>
                    <Ionicons name="arrow-forward" size={16} color={NL.bg} />
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                <View style={styles.copy}>
                  <Text style={titleStyle} accessibilityRole="header">
                    This lands in your inbox every Sunday.
                  </Text>
                  <Text style={styles.body}>
                    All the week's new auditions, with deadlines and dates. Free.
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.field}>
                    {isGuest ? (
                      <TextInput
                        {...POPUP_EMAIL_INPUT_PROPS}
                        style={styles.input}
                        placeholder={POPUP_EMAIL_PLACEHOLDER}
                        placeholderTextColor={NL.muted}
                        value={form.email}
                        onChangeText={form.setEmail}
                        onSubmitEditing={form.submit}
                        editable={!form.isSubmitting}
                      />
                    ) : (
                      <Text style={styles.lockedEmail} numberOfLines={1}>
                        {form.lockedEmail}
                      </Text>
                    )}
                    <Pressable
                      onPress={form.submit}
                      disabled={form.isSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Subscribe"
                      accessibilityState={{ busy: form.isSubmitting }}
                      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.submit,
                        webPointer,
                        hovered && styles.submitHovered,
                        pressed && styles.submitPressed,
                        form.isSubmitting && styles.submitBusy,
                      ]}
                    >
                      {form.isSubmitting ? (
                        <ActivityIndicator size="small" color={NL.bg} />
                      ) : (
                        <Ionicons name="arrow-forward" size={18} color={NL.bg} />
                      )}
                    </Pressable>
                  </View>

                  {!!form.emailSuggestion && (
                    <EmailSuggestion
                      suggestion={form.emailSuggestion}
                      onAccept={form.acceptEmailSuggestion}
                      variant="light"
                    />
                  )}

                  <PopupError message={form.error} />

                  <PopupConsent form={form} onOpenPrivacyPolicy={onOpenPrivacyPolicy} />

                  <Pressable
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.dismissButton,
                      webPointer,
                      hovered && styles.dismissButtonHovered,
                    ]}
                    onPress={() => close()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dismissButtonText}>Not now</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </>
  );
}

/** A miniature of the Sunday email, with the week's real auditions as its rows. */
function EmailPreview({ isSubscribed }: { isSubscribed: boolean }) {
  const { data: auditions, loading } = useAuditions(NEWSLETTER_POPUP_SAMPLE_AUDITIONS);
  const rowAnims = useRef(
    Array.from({ length: NEWSLETTER_POPUP_SAMPLE_AUDITIONS }, () => new Animated.Value(0)),
  ).current;
  // Loading, failed or empty: the skeleton keeps the shape of the email.
  const hasRows = !loading && auditions.length > 0;

  useEffect(() => {
    if (loading) return;
    if (prefersReducedMotion()) {
      rowAnims.forEach((value) => value.setValue(1));
      return;
    }
    rowAnims.forEach((value) => value.setValue(0));
    Animated.sequence([
      Animated.delay(ROWS_DELAY_MS),
      Animated.stagger(
        ROW_STAGGER_MS,
        rowAnims.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: ROW_ENTER_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [loading, rowAnims]);

  return (
    <View style={styles.panel} accessibilityLabel="Preview of the Sunday email">
      <View style={styles.panelHeader}>
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>D</Text>
        </View>
        <Text style={styles.sender} numberOfLines={1}>
          Danza · Sunday edit
        </Text>
        {isSubscribed ? <SubscribedPill /> : <Text style={styles.sentAt}>Sun 08:00</Text>}
      </View>

      <Text style={styles.subject}>This week's auditions</Text>

      {rowAnims.map((value, index) => {
        const audition = hasRows ? auditions[index] : null;
        if (hasRows && !audition) return null;
        const rowMotion = {
          opacity: value,
          transform: [
            { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
          ],
        };

        return audition ? (
          <Animated.View key={audition.id} style={[styles.row, rowMotion]}>
            <View style={[styles.dot, { backgroundColor: STATUS_DOT_COLOR[audition.status] }]} />
            <Text style={styles.company} numberOfLines={1}>
              {audition.company_name}
            </Text>
            <Text style={styles.rowDate} numberOfLines={1}>
              {sampleRowDate(audition)}
            </Text>
          </Animated.View>
        ) : (
          <View key={`skeleton-${index}`} style={styles.row}>
            <View style={[styles.dot, styles.skeletonFill]} />
            <View
              style={[
                styles.skeletonBar,
                { width: SKELETON_NAME_WIDTHS[index % SKELETON_NAME_WIDTHS.length] },
              ]}
            />
            <View style={[styles.skeletonBar, styles.skeletonDate]} />
          </View>
        );
      })}

      <LinearGradient
        colors={[PANEL_FADE_TOP, Colors.specSurface]}
        style={styles.panelFade}
        pointerEvents="none"
      />
    </View>
  );
}

/** Takes the timestamp's place once the subscription lands. */
function SubscribedPill() {
  const pop = useRef(new Animated.Value(prefersReducedMotion() ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  return (
    <Animated.View style={[styles.subscribedPill, { opacity: pop, transform: [{ scale: pop }] }]}>
      <Ionicons name="checkmark" size={11} color={NL.bg} />
      <Text style={styles.subscribedPillText}>Subscribed</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    pointerEvents: "box-none",
  },
  frame: {
    maxWidth: 460,
    width: "100%",
  },
  card: {
    backgroundColor: NL.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NL.hairline,
    padding: 28,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 0 rgba(0,0,0,.03), 0 30px 60px -30px rgba(0,0,0,.35)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 12,
      },
    }),
  },
  cardSmall: {
    padding: 22,
  },

  // ─── Top bar ───
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -6,
    marginBottom: 14,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NL.ink,
  },
  eyebrowText: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: NL.ink,
  },

  // ─── Email preview ───
  panel: {
    backgroundColor: Colors.specSurface,
    borderWidth: 1,
    borderColor: Colors.specDivider,
    borderRadius: 14,
    padding: 16,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monogram: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: "800",
    color: NL.bg,
  },
  sender: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 12.5,
    fontWeight: "700",
    color: NL.ink,
  },
  sentAt: {
    fontFamily: INTER,
    fontSize: 11.5,
    color: NL.muted,
  },
  subscribedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: NL.ink,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  subscribedPillText: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: "700",
    color: NL.bg,
  },
  subject: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: NL.ink,
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.specDivider,
  },
  dot: {
    width: STATUS_DOT_SIZE,
    height: STATUS_DOT_SIZE,
    borderRadius: STATUS_DOT_SIZE / 2,
  },
  company: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: "600",
    color: NL.ink,
  },
  rowDate: {
    flexShrink: 0,
    fontFamily: INTER,
    fontSize: 11.5,
    color: NL.muted,
  },
  skeletonFill: {
    backgroundColor: Colors.skeletonFill,
  },
  skeletonBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.skeletonFill,
  },
  skeletonDate: {
    width: 64,
    marginLeft: "auto",
  },
  panelFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
  },

  // ─── Copy ───
  copy: {
    marginTop: 22,
  },
  title: {
    fontFamily: INTER,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: NL.ink,
  },
  titleSmall: {
    fontSize: 20,
    lineHeight: 25,
  },
  body: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    color: NL.muted,
    marginTop: 8,
  },
  emailHighlight: {
    fontWeight: "700",
    color: NL.ink,
  },

  // ─── Form ───
  form: {
    marginTop: 20,
    gap: 12,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: FIELD_HEIGHT,
    borderWidth: 1,
    borderColor: NL.fieldBorder,
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: (FIELD_HEIGHT - SUBMIT_SIZE) / 2,
  },
  input: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15,
    color: NL.ink,
    ...Platform.select({ web: { outlineStyle: "none" } as object }),
  },
  lockedEmail: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: "600",
    color: NL.ink,
  },
  submit: {
    width: SUBMIT_SIZE,
    height: SUBMIT_SIZE,
    borderRadius: SUBMIT_SIZE / 2,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { transition: "opacity 0.15s, transform 0.1s" } as object }),
  },
  submitHovered: {
    opacity: 0.88,
  },
  submitPressed: {
    transform: [{ scale: 0.94 }],
  },
  submitBusy: {
    opacity: 0.6,
  },
  dismissButton: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  dismissButtonHovered: {
    backgroundColor: NL.hairline,
  },
  dismissButtonText: {
    fontFamily: INTER,
    fontSize: 13,
    color: NL.muted,
  },

  // ─── Success ───
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: NL.ink,
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  registerButtonHovered: {
    opacity: 0.9,
  },
  registerButtonText: {
    fontFamily: INTER,
    fontSize: 14.5,
    fontWeight: "700",
    color: NL.bg,
  },
});
