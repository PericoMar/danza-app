// src/components/TermsModal.tsx

import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';

interface TermsModalProps {
    visible: boolean;
    onAccept: () => void;
    onCancel: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, onAccept, onCancel }) => {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.content}>
                <Pressable style={styles.closeButton} onPress={onCancel}>
                    <Text style={{ fontSize: 18 }}>✕</Text>
                </Pressable>

                <Text style={styles.title}>Terms and Conditions</Text>

                <ScrollView style={styles.scrollArea}>
                    <Text style={styles.text}>
                        {`Effective Date: 05-27-2025

Welcome to [Your Website Name]. By accessing or using this website, you agree to be bound by the following Terms and Conditions. Please read them carefully. If you do not agree with any part of these terms, you must not use the site.

---

1. General Information

This website is intended to collect and share information submitted by users about professional dance companies around the world. It aims to provide a community-driven platform for dancers to share their experiences anonymously or publicly.

---

2. User Submissions

By submitting content to the website, you confirm that:
- You have the right to share the information you provide.
- You will not submit personal names, identifying details, or defamatory content.
- You will not post anything discriminatory, hateful, or harassing.
- You are solely responsible for your submissions.

Use of AI: User submissions may be summarized or rephrased using AI tools to ensure clarity and consistency. These tools are used only to present the content in a readable format without changing the original meaning. If you feel your submission has been misrepresented, you may request a correction or removal.

---

3. Content Disclaimer

All content presented on this website is user-generated and reflects individual experiences or opinions. We do not verify, endorse, or guarantee the accuracy, completeness, or reliability of any content shared by users.

No Liability: The platform, its creators, and administrators are not responsible for any damages, losses, or consequences that arise from the use of this site or the reliance on its content. This includes but is not limited to reputational harm, employment decisions, or contractual disputes involving individuals or companies mentioned on the platform.

You acknowledge and agree that the use of information found on this website is at your own risk.

---

4. Privacy and Anonymity

Users may choose to post anonymously or publicly. We strongly advise against including any names or personal identifiers of individuals in your submissions. We take reasonable steps to maintain data privacy, but we cannot guarantee anonymity if users include identifying details.

---

5. Moderation and Removal

We reserve the right to moderate, edit, or remove content that violates these Terms or our community standards without prior notice. Repeated violations may result in the banning of your access to the website.

---

6. Intellectual Property

All original content on this site, including the design and structure, belongs to danza-app.com unless otherwise stated. User-generated content remains the intellectual property of the user, but by posting, you grant us a non-exclusive right to publish, reproduce, and adapt the content.

---

7. Changes to These Terms

We may update these Terms and Conditions at any time. Changes will be posted on this page, and continued use of the site after such updates constitutes acceptance of the new terms.

---

8. Governing Law

These Terms and Conditions shall be governed by and construed in accordance with the laws of Spain, without regard to its conflict of law principles.

---

9. Contact

For questions, concerns, or requests regarding these terms, please contact us at danza-app@gmail.com`}
                    </Text>

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
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 100,
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
        maxHeight: screenHeight * 0.6,
        marginBottom: 20,
    },
    text: {
        fontSize: 14,
        color: '#333',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
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

export default TermsModal;
