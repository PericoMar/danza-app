import { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import {
  AccountHero,
  AccountButton,
  AccountCheckbox,
  accountStyles,
} from "@/components/account";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { loadCompaniesFonts, pageHPadding } from "@/theme/companies";
import { Colors } from "@/theme/colors";
import { ACCOUNT_DIALOG_MAX_WIDTH, TABLET_BREAKPOINT } from "@/constants/layout";
import { PROFILE_ROUTE } from "@/constants/profile";

export default function DeleteAccountScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_BREAKPOINT;
  const { isAcknowledged, toggleAcknowledged, isDeleting, error, confirm } = useDeleteAccount();

  useEffect(() => {
    loadCompaniesFonts();
  }, []);

  return (
    <View style={accountStyles.screen}>
      <SiteHeader />
      <ScrollView contentContainerStyle={accountStyles.scroll}>
        <View
          style={[
            accountStyles.shell,
            {
              paddingHorizontal: pageHPadding(width),
              paddingTop: isWide ? 96 : 44,
              paddingBottom: isWide ? 96 : 56,
            },
          ]}
        >
          <View style={[accountStyles.page, { maxWidth: ACCOUNT_DIALOG_MAX_WIDTH }]}>
            <AccountHero
              eyebrow="Delete account"
              title="Delete your account?"
              subtitle="Deleting your account permanently removes your profile, reviews and favorite companies, and signs you out. This can't be undone."
              isWide={isWide}
              tone="danger"
            />

            <View style={styles.confirm}>
              <AccountCheckbox
                label="I understand my account and data will be permanently deleted."
                checked={isAcknowledged}
                onToggle={toggleAcknowledged}
                disabled={isDeleting}
              />

              {error ? <Text style={accountStyles.errorText}>{error}</Text> : null}

              <View style={[styles.actions, !isWide && styles.actionsCompact]}>
                <AccountButton
                  variant="ghost"
                  label="Keep my account"
                  onPress={() => router.replace(PROFILE_ROUTE)}
                  disabled={isDeleting}
                  fullWidth={!isWide}
                />
                <AccountButton
                  variant="danger"
                  icon="trash-outline"
                  label="Delete my account"
                  onPress={confirm}
                  disabled={!isAcknowledged}
                  loading={isDeleting}
                  fullWidth={!isWide}
                  accessibilityHint="Permanently deletes your account"
                />
              </View>
            </View>
          </View>
        </View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  confirm: {
    marginTop: 40,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    gap: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionsCompact: {
    flexDirection: "column",
  },
});
