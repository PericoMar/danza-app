// src/components/ReviewMenuOptions.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator, Platform } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';

interface ReviewMenuOptionsProps {
  isVisible: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  position: { x: number; y: number; width: number };
}

export default function ReviewMenuOptions({
  isVisible,
  onClose,
  onDelete,
  isDeleting,
  position,
}: ReviewMenuOptionsProps) {
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', onClose);
    return () => {
      subscription.remove();
    };
  }, []);

  const computedStyle = {
    top: position.y - 20, // Ajusta según necesites para alineación vertical
    right: windowWidth - position.x - position.width, // Alineación a la derecha del botón
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      backdropOpacity={0}
      animationIn="fadeIn"
      animationOut="fadeOut"
      style={[styles.modal, computedStyle]}
    >
      <View style={styles.popover}>
        <Pressable
          style={[styles.item, isDeleting && styles.disabled]}
          onPress={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          )}
          <Text style={styles.deleteText}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.item, styles.bottomItem]}
          onPress={() => {
            // TODO: Implement edit action
          }}
        >
          <Ionicons name="pencil-outline" size={18} color="#2563eb" />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    margin: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingTop: Platform.OS === 'web' ? 50 : 60,
  },
  popover: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 140,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  deleteText: {
    fontSize: 15,
    color: '#EF4444',
  },
  bottomItem: {
    marginTop: 12,
  },
  editText: {
    fontSize: 15,
    color: '#2563eb',
  },
});
