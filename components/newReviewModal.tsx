// src/components/NewReviewModal.tsx
import { View, Text, TextInput, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface NewReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, rating: number, anonymous: boolean) => void;
}

export default function NewReviewModal({ visible, onClose, onSubmit }: NewReviewModalProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [anonymous, setAnonymous] = useState(false);

  const handlePressSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content, rating, anonymous);
    setContent('');
    setRating(0);
    setAnonymous(false);
    onClose();
  };

  const handleSelectRating = (value: number) => {
    setRating(value);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Write a Review</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Share your experience..."
            placeholderTextColor="#aaa"
            multiline
            value={content}
            onChangeText={setContent}
          />

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => handleSelectRating(value)}>
                <Ionicons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={28}
                  color="#facc15"
                  style={{ marginHorizontal: 4 }}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.anonymousToggle}
            onPress={() => setAnonymous(!anonymous)}
          >
            <Ionicons
              name={anonymous ? 'checkbox-outline' : 'square-outline'}
              size={20}
              color="#555"
            />
            <Text style={styles.anonymousText}>Post anonymously</Text>
          </Pressable>

          <Pressable style={styles.submitButton} onPress={handlePressSubmit}>
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </Pressable>
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
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  textInput: {
    height: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    color: '#000',
    marginBottom: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  anonymousText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
