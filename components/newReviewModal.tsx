// src/components/NewReviewModal.tsx
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

interface NewReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function NewReviewModal({ visible, onClose, onSubmit }: NewReviewModalProps) {
  const [salaryAmount, setSalaryAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('');
  const [salaryType, setSalaryType] = useState('');
  const [salaryNotes, setSalaryNotes] = useState('');

  const [operaCount, setOperaCount] = useState('');
  const [danceScore, setDanceScore] = useState('');
  const [disturbanceScore, setDisturbanceScore] = useState('');
  const [paidExtra, setPaidExtra] = useState('No');
  const [extraPayPerShow, setExtraPayPerShow] = useState('');
  const [extraCurrency, setExtraCurrency] = useState('');

  const handleSubmit = () => {
    onSubmit({
      salaryAmount,
      currency,
      salaryPeriod,
      salaryType,
      salaryNotes,
      operaCount,
      danceScore,
      disturbanceScore,
      paidExtra,
      extraPayPerShow,
      extraCurrency,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.header}>
              <Text style={styles.title}>Formulario del Bailarín</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {/* --- SALARIO --- */}
            <Text style={styles.sectionTitle}>💰 Salario</Text>
            <View style={styles.inlineGroup}>
              <TextInput
                style={styles.inputBox}
                placeholder="Cantidad"
                keyboardType="numeric"
                value={salaryAmount}
                onChangeText={setSalaryAmount}
              />
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Notas adicionales sobre el salario..."
              multiline
              value={salaryNotes}
              onChangeText={setSalaryNotes}
            />

            {/* --- ÓPERAS --- */}
            <Text style={styles.sectionTitle}>🎭 Óperas</Text>
            <View style={styles.inlineGroup}>
              <TextInput
                style={styles.inputBox}
                placeholder="Cantidad aprox."
                keyboardType="numeric"
                value={operaCount}
                onChangeText={setOperaCount}
              />
            </View>

            {paidExtra === 'Sí' && (
              <View style={styles.inlineGroup}>
                <TextInput
                  style={styles.inputBox}
                  placeholder="€ por show"
                  keyboardType="numeric"
                  value={extraPayPerShow}
                  onChangeText={setExtraPayPerShow}
                />
              </View>
            )}

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Enviar</Text>
            </Pressable>
          </ScrollView>
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
    padding: 10,
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: Platform.OS === 'ios' ? 50 : 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  inlineGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  inputBox: {
    flexBasis: '48%',
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  picker: {
    flexBasis: '48%',
    height: 48,
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
