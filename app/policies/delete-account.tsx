import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "@/theme/colors";
import { MOBILE_BREAKPOINT } from "@/constants/layout";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";

export default function DeleteAccountInfoScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  return (
    <View style={styles.screen}>
      <SiteHeader />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          !isMobile && styles.containerDesktop,
        ]}
      >
        <Text style={styles.heading}>Delete your Danza.app account</Text>
        <Text style={styles.text}>{`Last updated: 19/09/2026

This page explains how to permanently delete your Danza.app account and what happens to your data when you do.`}</Text>

        <Text style={styles.sectionTitle}>1. How to request deletion</Text>
        <Text style={styles.text}>{`You can delete your account directly from the Danza.app mobile app:

1. Open the Danza.app app and log in
2. Go to Profile
3. Tap "Delete account"
4. Confirm that you understand the action cannot be undone
5. Tap "Yes, delete my account"

Your account is deleted immediately — there is no waiting period.

If you no longer have access to the app, email us at danza.app.official@gmail.com from the address associated with your account and we will delete it for you.`}</Text>

        <Text style={styles.sectionTitle}>2. What data is deleted</Text>
        <Text style={styles.text}>{`Deleting your account permanently removes:

• Your login credentials and authentication record
• Your profile information
• Reviews you have submitted
• Your favourited companies

This data is deleted immediately and cannot be recovered.`}</Text>

        <Text style={styles.sectionTitle}>3. What data is retained</Text>
        <Text style={styles.text}>{`We do not retain any of the data listed above after your account is deleted.

If you are separately subscribed to our email newsletter with an address different from your account email, that subscription is not affected by account deletion — you can unsubscribe at any time using the link in any newsletter email.`}</Text>

        <Text style={styles.sectionTitle}>4. Questions</Text>
        <Text style={styles.text}>{`If you have any questions about account deletion or your data, contact us at danza.app.official@gmail.com. See our Privacy Policy for more information about how we handle your data.`}</Text>
      </ScrollView>
      <SiteFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  containerDesktop: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginTop: 20,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
});
