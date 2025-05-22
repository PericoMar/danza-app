import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccordionBox from './ui/AccordionBox';

interface NewReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function NewReviewModal({ visible, onClose, onSubmit }: NewReviewModalProps) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(50);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </Pressable>

          <Text style={styles.title}>New Review</Text>

          <AccordionBox
            title="Salary"
            description="Describe how much you perceive during your work in this company."
            placeholder="€ Monthly salary"
            iconName="cash-outline"
            toolboxInfo="Include only your base gross monthly salary, without bonuses or benefits."
          />

        </Animated.View>
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
    paddingHorizontal: 20,
  },
  modalContainer: {
    maxWidth: 1200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 20,
    color: '#222',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
});
