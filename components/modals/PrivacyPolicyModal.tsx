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
          <Text style={styles.text}>
            {/* TODO: Add legal text for newsletter privacy policy */}
            {`Effective Date: [DATE]

This Privacy Policy describes how danza.app collects, uses, and protects your personal information when you subscribe to our newsletter.

1. Information We Collect

When you subscribe to our newsletter, we collect:
- Your email address
- Subscription preferences
- Date and time of subscription

2. How We Use Your Information

We use your email address to:
- Send you audition alerts and updates
- Notify you about new features and services
- Share relevant dance industry news

3. Data Protection

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or destruction.

4. Your Rights

You have the right to:
- Unsubscribe at any time
- Request access to your data
- Request deletion of your data

5. Contact

For questions about this Privacy Policy, please contact us at danza-app@gmail.com`}
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
