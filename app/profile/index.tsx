import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import {
  AccountHero,
  AccountSection,
  AccountTextField,
  AccountButton,
  IdentityBadge,
  SaveBubble,
  accountStyles,
} from "@/components/account";
import { useProfileForm } from "@/hooks/useProfileForm";
import { loadCompaniesFonts, pageHPadding } from "@/theme/companies";
import { Colors } from "@/theme/colors";
import {
  MOBILE_BREAKPOINT,
  PROFILE_CONTENT_MAX_WIDTH,
  SAVE_BUBBLE_CLEARANCE,
  TABLET_BREAKPOINT,
} from "@/constants/layout";
import { DELETE_ACCOUNT_ROUTE } from "@/constants/profile";

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_BREAKPOINT;
  const isCompact = width < MOBILE_BREAKPOINT;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadCompaniesFonts();
  }, []);

  const {
    email,
    values,
    setField,
    nameError,
    saveStatus,
    canSave,
    isLoading,
    loadError,
    submit,
    reset,
  } = useProfileForm();

  if (isLoading || loadError) {
    return (
      <View style={accountStyles.screen}>
        <SiteHeader />
        <View style={accountStyles.center}>
          {loadError ? (
            <Text style={accountStyles.bodyText}>
              We couldn't load your profile. Please refresh and try again.
            </Text>
          ) : (
            <ActivityIndicator size="large" color={Colors.text} />
          )}
        </View>
      </View>
    );
  }

  const fullName = [values.name, values.last_name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <View style={accountStyles.screen}>
      <SiteHeader />

      <ScrollView
        // Leave room below the footer so the floating save bubble never covers content.
        contentContainerStyle={[
          accountStyles.scroll,
          { paddingBottom: SAVE_BUBBLE_CLEARANCE + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            accountStyles.shell,
            {
              paddingHorizontal: pageHPadding(width),
              paddingTop: isWide ? 88 : 40,
              paddingBottom: isWide ? 88 : 48,
            },
          ]}
        >
          <View style={[accountStyles.page, { maxWidth: PROFILE_CONTENT_MAX_WIDTH }]}>
            <AccountHero
              eyebrow="Your account"
              title="Profile"
              subtitle="How you show up on Danza App. Keep it short, keep it you."
              isWide={isWide}
              aside={<IdentityBadge fullName={fullName} email={email} isWide={isWide} />}
            />

            <View style={{ marginTop: isWide ? 72 : 40 }}>
              <AccountSection
                index="01"
                title="Personal details"
                description="Your email is tied to how you sign in, so it can't be changed here."
                isWide={isWide}
              >
                <View style={isCompact ? styles.nameColumn : styles.nameRow}>
                  <View style={!isCompact && styles.nameCell}>
                    <AccountTextField
                      label="First name"
                      value={values.name}
                      onChangeText={(v) => setField("name", v)}
                      placeholder="Your first name"
                      error={nameError}
                      inputProps={{ autoComplete: "given-name", textContentType: "givenName" }}
                    />
                  </View>
                  <View style={!isCompact && styles.nameCell}>
                    <AccountTextField
                      label="Last name"
                      value={values.last_name}
                      onChangeText={(v) => setField("last_name", v)}
                      placeholder="Your last name"
                      inputProps={{ autoComplete: "family-name", textContentType: "familyName" }}
                    />
                  </View>
                </View>

                <AccountTextField label="Email" value={email} icon="mail-outline" locked />
              </AccountSection>

              <AccountSection
                index="02"
                title="About you"
                description="A few lines on your training, your style or where you dance."
                isWide={isWide}
              >
                <AccountTextField
                  label="Description"
                  value={values.bio}
                  onChangeText={(v) => setField("bio", v)}
                  placeholder="Contemporary dancer based in Madrid…"
                  multiline
                />
              </AccountSection>

              <AccountSection
                index="03"
                title="Social"
                description="Links to the profiles where people can see your work."
                isWide={isWide}
              >
                <AccountTextField
                  label="Instagram"
                  value={values.instagram_url}
                  onChangeText={(v) => setField("instagram_url", v)}
                  placeholder="instagram.com/yourname"
                  icon="logo-instagram"
                  inputProps={{ autoCapitalize: "none", autoCorrect: false, keyboardType: "url" }}
                />
                <AccountTextField
                  label="LinkedIn"
                  value={values.linkedin_url}
                  onChangeText={(v) => setField("linkedin_url", v)}
                  placeholder="linkedin.com/in/yourname"
                  icon="logo-linkedin"
                  inputProps={{ autoCapitalize: "none", autoCorrect: false, keyboardType: "url" }}
                />
              </AccountSection>

              <AccountSection
                index="04"
                title="Delete account"
                description="Permanently remove your account, reviews and favorites. This can't be undone."
                isWide={isWide}
              >
                <AccountButton
                  variant="danger"
                  icon="trash-outline"
                  label="Delete account"
                  onPress={() => router.push(DELETE_ACCOUNT_ROUTE)}
                  fullWidth={!isWide}
                />
              </AccountSection>
            </View>
          </View>
        </View>

        <SiteFooter />
      </ScrollView>

      <SaveBubble
        status={saveStatus}
        canSave={canSave}
        onSave={submit}
        onDiscard={reset}
        isCompact={isCompact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    gap: 16,
  },
  nameColumn: {
    gap: 18,
  },
  nameCell: {
    flex: 1,
    minWidth: 0,
  },
});
