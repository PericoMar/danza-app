// Nuevo componente ConfirmSubmitModal.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Modal } from 'react-native-paper';

interface ConfirmSubmitModalProps {
  visible: boolean;
  missingFields: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmSubmitModal({ visible, missingFields, onCancel, onConfirm }: ConfirmSubmitModalProps) {
  return (
    <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={styles.confirmModalWrapper}>
      <View style={styles.confirmModalContainer}>
        <Text style={styles.confirmTitle}>We'd love your full opinion!</Text>
        <Text style={styles.confirmMessage}>You haven't talked about:</Text>
        {missingFields.map((field, index) => (
          <Text key={index} style={styles.confirmListItem}>• {field}</Text>
        ))}

        <View style={styles.confirmButtonRow}>
          <Pressable style={styles.editButton} onPress={onCancel}>
            <Text style={styles.editButtonText}>Continue Editing</Text>
          </Pressable>
          <Pressable style={styles.finalSubmitButton} onPress={onConfirm}>
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
  },
  finalSubmitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
