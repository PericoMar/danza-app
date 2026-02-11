import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "@/theme/colors";
import { MOBILE_BREAKPOINT } from "@/constants/layout";

export default function TermsScreen() {
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
        <Text style={styles.heading}>Terms and Conditions</Text>
        <Text style={styles.text}>{`Effective Date: 05-27-2025

Welcome to danza.app. By accessing or using this website, you agree to be bound by the following Terms and Conditions. Please read them carefully. If you do not agree with any part of these terms, you must not use the site.`}</Text>

        <Text style={styles.sectionTitle}>1. General Information</Text>
        <Text style={styles.text}>{`This website is intended to collect and share information submitted by users about professional dance companies around the world. It aims to provide a community-driven platform for dancers to share their experiences anonymously or publicly.`}</Text>

        <Text style={styles.sectionTitle}>2. User Submissions</Text>
        <Text style={styles.text}>{`By submitting content to the website, you confirm that:

\u2022 You have the right to share the information you provide.
\u2022 You will not submit personal names, identifying details, or defamatory content.
\u2022 You will not post anything discriminatory, hateful, or harassing.
\u2022 You are solely responsible for your submissions.

Use of AI: User submissions may be summarized or rephrased using AI tools to ensure clarity and consistency. These tools are used only to present the content in a readable format without changing the original meaning. If you feel your submission has been misrepresented, you may request a correction or removal.`}</Text>

        <Text style={styles.sectionTitle}>3. Content Disclaimer</Text>
        <Text style={styles.text}>{`All content presented on this website is user-generated and reflects individual experiences or opinions. We do not verify, endorse, or guarantee the accuracy, completeness, or reliability of any content shared by users.

No Liability: The platform, its creators, and administrators are not responsible for any damages, losses, or consequences that arise from the use of this site or the reliance on its content. This includes but is not limited to reputational harm, employment decisions, or contractual disputes involving individuals or companies mentioned on the platform.

You acknowledge and agree that the use of information found on this website is at your own risk.`}</Text>

        <Text style={styles.sectionTitle}>4. Privacy and Anonymity</Text>
        <Text style={styles.text}>{`Users may choose to post anonymously or publicly. We strongly advise against including any names or personal identifiers of individuals in your submissions. We take reasonable steps to maintain data privacy, but we cannot guarantee anonymity if users include identifying details.`}</Text>

        <Text style={styles.sectionTitle}>5. Moderation and Removal</Text>
        <Text style={styles.text}>{`We reserve the right to moderate, edit, or remove content that violates these Terms or our community standards without prior notice. Repeated violations may result in the banning of your access to the website.`}</Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.text}>{`All original content on this site, including the design and structure, belongs to danza-app.com unless otherwise stated. User-generated content remains the intellectual property of the user, but by posting, you grant us a non-exclusive right to publish, reproduce, and adapt the content.`}</Text>

        <Text style={styles.sectionTitle}>7. Changes to These Terms</Text>
        <Text style={styles.text}>{`We may update these Terms and Conditions at any time. Changes will be posted on this page, and continued use of the site after such updates constitutes acceptance of the new terms.`}</Text>

        <Text style={styles.sectionTitle}>8. Governing Law</Text>
        <Text style={styles.text}>{`These Terms and Conditions shall be governed by and construed in accordance with the laws of Spain, without regard to its conflict of law principles.`}</Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.text}>{`For questions, concerns, or requests regarding these terms, please contact us at danza.app.official@gmail.com`}</Text>
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
