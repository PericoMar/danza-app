import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { INTER } from "@/theme/companies";
import { Colors } from "@/theme/colors";
import { NewsletterPopupCloseReason } from "@/constants/newsletterPopup";
import { usePopupPresence } from "@/hooks/usePopupPresence";
import { NL } from "../../styles";
import { EmailSuggestion } from "../../EmailSuggestion";
import { ValidatingNotice } from "../../ValidatingNotice";
import { PopupConsent } from "../PopupConsent";
import { PopupError } from "../PopupError";
import { CloseButton } from "@/components/common/CloseButton";
import { POPUP_EMAIL_INPUT_PROPS, POPUP_EMAIL_PLACEHOLDER } from "../emailInput";
import type { NewsletterPopupViewProps } from "../types";

const PHOTO = require("@/assets/images/3.jpg");
// Below this the photo stops being a column and becomes a band on top.
const SPLIT_MIN_WIDTH = 720;
const CARD_MAX_WIDTH = 760;
const CARD_RADIUS = 20;
const PHOTO_BAND_HEIGHT = 180;
// The photo is portrait (1638×2048) with the dancer in its upper third. As a
// wide band it is shifted up so the band shows the dancer, not their feet.
const PHOTO_ASPECT = 2048 / 1638;
const PHOTO_FOCUS_Y = 0.32;
const ENTRANCE_OFFSET = 16;
// The photo darkens from 40% down, so the caption reads on any frame.
const PHOTO_SHADE = {
  colors: ["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"] as const,
  locations: [0.4, 1] as const,
};

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

/** Magazine-style split: a dance photo on one side, the form on the other. */
export function EditorialSplitPopup({
  form,
  onClose,
  onOpenPrivacyPolicy,
  onCreateAccount,
  autoCloseAfterSuccessMs,
}: NewsletterPopupViewProps) {
  const { width } = useWindowDimensions();
  const isSplit = width >= SPLIT_MIN_WIDTH;
  const isGuest = !form.lockedEmail;
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [bandWidth, setBandWidth] = useState(0);
  const bandPhotoHeight = bandWidth * PHOTO_ASPECT;
  const bandPhotoTop = Math.min(0, PHOTO_BAND_HEIGHT / 2 - bandPhotoHeight * PHOTO_FOCUS_Y);

  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ENTRANCE_OFFSET, 0],
    extrapolate: "clamp",
  });

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.centeredContainer}
      >
        {/* The shadow lives on this frame: iOS drops shadows on views that
            clip their content, and the card has to clip the photo. */}
        <Animated.View style={[styles.cardFrame, { opacity, transform: [{ translateY }] }]}>
          <View style={[styles.card, isSplit && styles.cardSplit]} accessibilityViewIsModal>
            <View
              style={isSplit ? styles.photoColumn : styles.photoBand}
              onLayout={(event) => setBandWidth(event.nativeEvent.layout.width)}
            >
              <Image
                source={PHOTO}
                style={
                  isSplit || !bandWidth
                    ? styles.photo
                    : [styles.photoInBand, { top: bandPhotoTop, height: bandPhotoHeight }]
                }
                resizeMode="cover"
              />
              <LinearGradient
                colors={PHOTO_SHADE.colors}
                locations={PHOTO_SHADE.locations}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.caption, !isSplit && styles.captionBand]}>
                <Text style={styles.captionEyebrow}>The Sunday edit</Text>
                <Text style={[styles.captionTitle, !isSplit && styles.captionTitleBand]}>
                  {"Every audition.\nOne email."}
                </Text>
              </View>
              {!isSplit && (
                <CloseButton
                  onPress={() => close()}
                  tone="dark"
                  style={styles.closeOnPhoto}
                />
              )}
            </View>

            <ScrollView
              style={isSplit ? styles.scrollSplit : styles.scroll}
              contentContainerStyle={[styles.content, !isSplit && styles.contentNarrow]}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {isSplit && <CloseButton onPress={() => close()} style={styles.closeButton} />}

              {form.isSubscribed ? (
                <>
                  <Text style={styles.eyebrow}>Subscribed</Text>
                  <Text style={[styles.headline, !isSplit && styles.headlineNarrow]}>
                    You're in.
                  </Text>
                  <Text style={styles.body}>
                    See you Sunday at{" "}
                    <Text style={styles.emailHighlight}>{form.subscribedEmail}</Text>.
                  </Text>
                  {form.isValidating && <ValidatingNotice />}
                  {isGuest && (
                    <Pressable
                      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.button,
                        styles.successButton,
                        webPointer,
                        hovered && styles.buttonHovered,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        close(NewsletterPopupCloseReason.DONE);
                        onCreateAccount();
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>Create an account</Text>
                      <Ionicons name="arrow-forward" size={17} color={NL.bg} />
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.eyebrow}>Audition alerts</Text>
                  <Text style={[styles.headline, !isSplit && styles.headlineNarrow]}>
                    {"Never miss\n"}
                    <Text style={styles.headlineMuted}>an audition.</Text>
                  </Text>
                  <Text style={styles.body}>
                    All the week's new auditions, deadlines and dates — every Sunday, free.
                  </Text>

                  <View style={styles.form}>
                    <View style={[styles.underline, isInputFocused && styles.underlineFocused]}>
                      <Ionicons
                        name={isGuest ? "mail-outline" : "mail"}
                        size={18}
                        color={isGuest ? NL.muted : NL.ink}
                      />
                      {isGuest ? (
                        <TextInput
                          {...POPUP_EMAIL_INPUT_PROPS}
                          style={styles.input}
                          placeholder={POPUP_EMAIL_PLACEHOLDER}
                          placeholderTextColor={NL.muted}
                          value={form.email}
                          onChangeText={form.setEmail}
                          onSubmitEditing={form.submit}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          editable={!form.isSubmitting}
                        />
                      ) : (
                        <Text style={styles.lockedEmail} numberOfLines={1}>
                          {form.lockedEmail}
                        </Text>
                      )}
                    </View>

                    {!!form.emailSuggestion && (
                      <EmailSuggestion
                        suggestion={form.emailSuggestion}
                        onAccept={form.acceptEmailSuggestion}
                        variant="light"
                      />
                    )}

                    <Pressable
                      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.button,
                        webPointer,
                        hovered && styles.buttonHovered,
                        pressed && styles.buttonPressed,
                        form.isSubmitting && styles.buttonDisabled,
                      ]}
                      onPress={form.submit}
                      disabled={form.isSubmitting}
                      accessibilityRole="button"
                      accessibilityState={{ busy: form.isSubmitting }}
                    >
                      {form.isSubmitting ? (
                        <ActivityIndicator size="small" color={NL.bg} />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Subscribe</Text>
                          <Ionicons name="arrow-forward" size={17} color={NL.bg} />
                        </>
                      )}
                    </Pressable>

                    <PopupError message={form.error} />

                    <PopupConsent form={form} onOpenPrivacyPolicy={onOpenPrivacyPolicy} />

                    <Pressable
                      style={[styles.noThanks, webPointer]}
                      onPress={() => close()}
                      accessibilityRole="button"
                    >
                      <Text style={styles.noThanksText}>No thanks</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 12, 0.6)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      } as object,
    }),
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    pointerEvents: "box-none",
  },
  // maxHeight + flexShrink down the chain let a tall card shrink to the screen
  // and scroll its form instead of spilling off the top.
  cardFrame: {
    width: "100%",
    maxWidth: CARD_MAX_WIDTH,
    maxHeight: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: NL.bg,
    ...Platform.select({
      web: {
        boxShadow: "0 40px 80px -30px rgba(0,0,0,.45)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 14,
      },
    }),
  },
  card: {
    flexShrink: 1,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: NL.bg,
  },
  cardSplit: {
    flexDirection: "row",
  },

  // ─── Photo ───
  photoColumn: {
    width: "44%",
    overflow: "hidden",
    backgroundColor: NL.ink,
  },
  photoBand: {
    height: PHOTO_BAND_HEIGHT,
    overflow: "hidden",
    backgroundColor: NL.ink,
  },
  // An explicit size: on web a bundled image otherwise keeps its intrinsic
  // 1638×2048 and only its top-left corner shows.
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  photoInBand: {
    position: "absolute",
    left: 0,
    width: "100%",
  },
  caption: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 28,
  },
  captionBand: {
    left: 24,
    right: 24,
    bottom: 20,
  },
  captionEyebrow: {
    fontFamily: INTER,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
  },
  captionTitle: {
    fontFamily: INTER,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -1,
    textTransform: "uppercase",
    color: NL.bg,
  },
  captionTitleBand: {
    fontSize: 20,
    lineHeight: 22,
  },
  closeOnPhoto: {
    position: "absolute",
    top: 12,
    right: 12,
    // A soft disc keeps the "×" readable over light parts of the photo.
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  // ─── Form column ───
  // Stacked, the form wraps its content and only scrolls at the max height;
  // side by side, it takes the width the photo leaves.
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollSplit: {
    flex: 1,
  },
  content: {
    padding: 40,
  },
  contentNarrow: {
    padding: 24,
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
  },
  eyebrow: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.grey2,
    marginBottom: 14,
  },
  headline: {
    fontFamily: INTER,
    fontSize: 30,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -1.2,
    textTransform: "uppercase",
    color: NL.ink,
  },
  headlineNarrow: {
    fontSize: 24,
    lineHeight: 25,
  },
  headlineMuted: {
    color: Colors.textMuted,
  },
  body: {
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: 21,
    color: NL.muted,
    marginTop: 14,
  },
  emailHighlight: {
    fontWeight: "700",
    color: NL.ink,
  },
  form: {
    marginTop: 26,
    gap: 14,
  },
  underline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ruleStrong,
  },
  underlineFocused: {
    borderBottomColor: NL.ink,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: INTER,
    fontSize: 17,
    color: NL.ink,
    ...Platform.select({ web: { outlineStyle: "none" } as object }),
  },
  lockedEmail: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 17,
    fontWeight: "600",
    color: NL.ink,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 6,
    backgroundColor: NL.ink,
    ...Platform.select({ web: { transition: "opacity 0.15s, transform 0.1s" } as object }),
  },
  buttonHovered: {
    opacity: 0.88,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: "700",
    color: NL.bg,
  },
  successButton: {
    marginTop: 26,
  },
  noThanks: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  noThanksText: {
    fontFamily: INTER,
    fontSize: 13,
    color: NL.muted,
  },
});
