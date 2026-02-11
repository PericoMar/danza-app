import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { Colors } from '@/theme/colors';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ visible, onAccept, onCancel }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <Text style={{ fontSize: 18 }}>✕</Text>
        </Pressable>

        <Text style={styles.title}>Privacy Policy</Text>

        <ScrollView style={styles.scrollArea}>
          <Text style={styles.text}>{`Last updated: 30/01/2026

This Privacy Policy explains how Danza.app ("we", "us", "our") collects, uses, and protects your personal data when you use our website danza-app.com (the "Website") and our email communications.

If you have any questions about this policy or your data, you can contact us at:
Email: danza.app.official@gmail.com`}</Text>

          <Text style={styles.sectionTitle}>1. Who we are</Text>
          <Text style={styles.text}>{`Danza.app is an informational platform for dancers and companies, providing audition information, company insights, and optional email alerts.

We operate within the European Union and comply with the General Data Protection Regulation (GDPR).`}</Text>

          <Text style={styles.sectionTitle}>2. Personal data we collect</Text>
          <Text style={styles.text}>{`We only collect data that is necessary to provide our services.

This may include:

- Account information, such as your email address and login credentials, when you register on the website
- Email address (when you subscribe to our newsletter or alerts)
- User preferences, such as favourited companies
- Reviews or feedback submitted by users (anonymous unless otherwise stated)
- User-submitted reviews and feedback, including content used for AI-generated summaries (anonymous unless otherwise stated)
- Basic website usage data (if analytics are enabled)

We do not knowingly collect sensitive personal data.`}</Text>

          <Text style={styles.sectionTitle}>3. Why we collect your data</Text>
          <Text style={styles.text}>{`We use your data for the following purposes:

- To create, maintain, and secure user accounts
- To comply with legal obligations and prevent misuse of the Website
- To send weekly audition alerts by email (if you opt in)
- To send instant alerts for auditions from favourited companies (if you opt in)
- To manage and improve the Website
- To display anonymous user-submitted reviews and feedback on the Website and improve user experience
- To generate AI-powered summaries of user-submitted reviews, improving discoverability and readability for other users
- To respond to messages or requests you send us

We may occasionally include information about partners, discounts, or promotions relevant to dancers.

Your data will not be used for purposes other than those described here.`}</Text>

          <Text style={styles.sectionTitle}>4. Legal basis for processing</Text>
          <Text style={styles.text}>{`Under the General Data Protection Regulation (GDPR), we process your personal data on the following legal bases:

- Your consent, when you subscribe to newsletters, audition alerts, or promotional communications. You may withdraw your consent at any time by unsubscribing or contacting us.
- Performance of a contract, when you create an account or use registered features of the Website, such as saving preferences or receiving personalised alerts.
- Legitimate interests, where processing is necessary to operate, secure, and improve the Website, prevent misuse, and ensure its proper functioning, provided that your rights and freedoms are not overridden.

Your personal data will only be processed for the purposes described in this Privacy Policy.`}</Text>

          <Text style={styles.sectionTitle}>5. Email communications</Text>
          <Text style={styles.text}>{`If you subscribe to our newsletter or alerts:

- You will only receive emails you explicitly opted into
- Every email includes an unsubscribe link
- You can unsubscribe at any time without providing a reason

Unsubscribing will stop all future email communications from us.`}</Text>

          <Text style={styles.sectionTitle}>6. Third-party services</Text>
          <Text style={styles.text}>{`We use trusted third-party service providers to operate and maintain Danza.app. These providers process personal data on our behalf and are contractually required to comply with GDPR and applicable data protection laws.

These services may include:

- Email delivery service: Brevo
- Website hosting provider: Vercel

We do not sell or rent your personal data to third parties.

Where personal data is processed or stored outside the European Union, appropriate safeguards are in place, such as Standard Contractual Clauses or equivalent legal mechanisms, to ensure the protection of your data.`}</Text>

          <Text style={styles.sectionTitle}>7. Data retention</Text>
          <Text style={styles.text}>{`We keep your personal data only for as long as necessary:

- Email addresses are stored until you unsubscribe
- User preferences are stored until you delete your account or request removal

You may request deletion of your data at any time.`}</Text>

          <Text style={styles.sectionTitle}>8. Your rights under GDPR</Text>
          <Text style={styles.text}>{`As a user, you have the right to:

- Access the personal data we hold about you
- Request correction of inaccurate data
- Request deletion of your data
- Withdraw consent at any time
- Object to certain processing activities
- Lodge a complaint with a data protection authority

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

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
            <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onAccept}>
            <Text style={styles.buttonText}>Accept</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 200,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollArea: {
    maxHeight: screenHeight * 0.55,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.purple,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PrivacyPolicyModal;
