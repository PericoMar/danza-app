// src/components/NewReviewModal.tsx
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import AccordionBox from './ui/AccordionBox';

interface NewReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function NewReviewModal({ visible, onClose, onSubmit }: NewReviewModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Botón de cerrar */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </Pressable>

          <AccordionBox
            title="Salary"
            description="Describe how much you perceive during your work in this company."
            placeholder="€ Monthly salary"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
});
