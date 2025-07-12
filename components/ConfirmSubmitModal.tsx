import { MIN_FIELDS_REQUIRED, REVIEW_FIELDS } from '@/constants/fields';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Modal } from 'react-native-paper';

interface ConfirmSubmitModalProps {
  visible: boolean;
  missingFields: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmSubmitModal({
  visible,
  missingFields,
  onCancel,
  onConfirm,
}: ConfirmSubmitModalProps) {
  // El cálculo correcto:
  const nonMissingFields = REVIEW_FIELDS.length - missingFields.length;
  const canSubmit = nonMissingFields >= MIN_FIELDS_REQUIRED;

  return (
    <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={styles.confirmModalWrapper}>
      <View style={styles.confirmModalContainer}>
        <Text style={styles.confirmTitle}>We'd love your full opinion!</Text>
        <Text style={styles.confirmMessage}>You haven't talked about:</Text>
        {missingFields.map((field, index) => (
          <Text key={index} style={styles.confirmListItem}>• {field}</Text>
        ))}

        {!canSubmit && (
          <Text style={styles.errorText}>
            You need to fill in at least {MIN_FIELDS_REQUIRED} comment{MIN_FIELDS_REQUIRED > 1 ? 's' : ''} to publish your review.
          </Text>
        )}

        <View style={styles.confirmButtonRow}>
          <Pressable style={styles.editButton} onPress={onCancel}>
            <Text style={styles.editButtonText}>Continue Editing</Text>
          </Pressable>
          <Pressable
            style={[
              styles.finalSubmitButton,
              !canSubmit && styles.finalSubmitButtonDisabled,
            ]}
            onPress={onConfirm}
            disabled={!canSubmit}
          >
            <Text style={styles.finalSubmitButtonText}>Submit Anyway</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  confirmModalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flex: 1,
  },
  confirmModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#222',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  confirmListItem: {
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  editButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  finalSubmitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#000',
    opacity: 1,
  },
  finalSubmitButtonDisabled: {
    backgroundColor: '#888',
    opacity: 0.5,
  },
  finalSubmitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
});
