import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "@/theme/colors";
import { MOBILE_BREAKPOINT } from "@/constants/layout";

export default function PrivacyPolicyScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          !isMobile && styles.containerDesktop,
        ]}
      >
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.text}>{`Last updated: 30/01/2026

This Privacy Policy explains how Danza.app (\u201cwe\u201d, \u201cus\u201d, \u201cour\u201d) collects, uses, and protects your personal data when you use our website danza-app.com (the \u201cWebsite\u201d) and our email communications.

If you have any questions about this policy or your data, you can contact us at:
Email: danza.app.official@gmail.com`}</Text>

        <Text style={styles.sectionTitle}>1. Who we are</Text>
        <Text style={styles.text}>{`Danza.app is an informational platform for dancers and companies, providing audition information, company insights, and optional email alerts.

We operate within the European Union and comply with the General Data Protection Regulation (GDPR).`}</Text>

        <Text style={styles.sectionTitle}>2. Personal data we collect</Text>
        <Text style={styles.text}>{`We only collect data that is necessary to provide our services.

This may include:

\u2022 Account information, such as your email address and login credentials, when you register on the website
\u2022 Email address (when you subscribe to our newsletter or alerts)
\u2022 User preferences, such as favourited companies
\u2022 Reviews or feedback submitted by users (anonymous unless otherwise stated)
\u2022 User-submitted reviews and feedback, including content used for AI-generated summaries (anonymous unless otherwise stated)
\u2022 Basic website usage data (if analytics are enabled)

We do not knowingly collect sensitive personal data.`}</Text>

        <Text style={styles.sectionTitle}>3. Why we collect your data</Text>
        <Text style={styles.text}>{`We use your data for the following purposes:

\u2022 To create, maintain, and secure user accounts
\u2022 To comply with legal obligations and prevent misuse of the Website
\u2022 To send weekly audition alerts by email (if you opt in)
\u2022 To send instant alerts for auditions from favourited companies (if you opt in)
\u2022 To manage and improve the Website
\u2022 To display anonymous user-submitted reviews and feedback on the Website and improve user experience
\u2022 To generate AI-powered summaries of user-submitted reviews, improving discoverability and readability for other users
\u2022 To respond to messages or requests you send us

We may occasionally include information about partners, discounts, or promotions relevant to dancers.

Your data will not be used for purposes other than those described here.`}</Text>

        <Text style={styles.sectionTitle}>4. Legal basis for processing</Text>
        <Text style={styles.text}>{`Under the General Data Protection Regulation (GDPR), we process your personal data on the following legal bases:

\u2022 Your consent, when you subscribe to newsletters, audition alerts, or promotional communications. You may withdraw your consent at any time by unsubscribing or contacting us.
\u2022 Performance of a contract, when you create an account or use registered features of the Website, such as saving preferences or receiving personalised alerts.
\u2022 Legitimate interests, where processing is necessary to operate, secure, and improve the Website, prevent misuse, and ensure its proper functioning, provided that your rights and freedoms are not overridden.

Your personal data will only be processed for the purposes described in this Privacy Policy.`}</Text>

        <Text style={styles.sectionTitle}>5. Email communications</Text>
        <Text style={styles.text}>{`If you subscribe to our newsletter or alerts:

\u2022 You will only receive emails you explicitly opted into
\u2022 Every email includes an unsubscribe link
\u2022 You can unsubscribe at any time without providing a reason

Unsubscribing will stop all future email communications from us.`}</Text>

        <Text style={styles.sectionTitle}>6. Third-party services</Text>
        <Text style={styles.text}>{`We use trusted third-party service providers to operate and maintain Danza.app. These providers process personal data on our behalf and are contractually required to comply with GDPR and applicable data protection laws.

These services may include:

\u2022 Email delivery service: Brevo
\u2022 Website hosting provider: Vercel

We do not sell or rent your personal data to third parties.

Where personal data is processed or stored outside the European Union, appropriate safeguards are in place, such as Standard Contractual Clauses or equivalent legal mechanisms, to ensure the protection of your data.`}</Text>

        <Text style={styles.sectionTitle}>7. Data retention</Text>
        <Text style={styles.text}>{`We keep your personal data only for as long as necessary:

\u2022 Email addresses are stored until you unsubscribe
\u2022 User preferences are stored until you delete your account or request removal

You may request deletion of your data at any time.`}</Text>

        <Text style={styles.sectionTitle}>8. Your rights under GDPR</Text>
        <Text style={styles.text}>{`As a user, you have the right to:

\u2022 Access the personal data we hold about you
\u2022 Request correction of inaccurate data
\u2022 Request deletion of your data
\u2022 Withdraw consent at any time
\u2022 Object to certain processing activities
\u2022 Lodge a complaint with a data protection authority

To exercise your rights, contact us at danza.app.official@gmail.com`}</Text>

        <Text style={styles.sectionTitle}>9. Data security</Text>
        <Text style={styles.text}>{`We take appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, misuse, or alteration.

These measures include access controls, secure systems, and the use of trusted service providers. While no system can be completely secure, we work to protect your data to the best of our ability.`}</Text>

        <Text style={styles.sectionTitle}>10. Cookies and tracking</Text>
        <Text style={styles.text}>{`We use minimal analytics cookies to understand how the Website is used. These cookies do not track you across other sites. You can manage or disable cookies through your browser settings, but some parts of the website may not function correctly if cookies are disabled.`}</Text>

        <Text style={styles.sectionTitle}>11. Changes to this Privacy Policy</Text>
        <Text style={styles.text}>{`We may update this Privacy Policy from time to time. The most recent version will always be available on this page, with the updated date shown at the top.

By using the Website or subscribing to our emails, you acknowledge that you have read and understood this Privacy Policy.`}</Text>
      </ScrollView>
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
