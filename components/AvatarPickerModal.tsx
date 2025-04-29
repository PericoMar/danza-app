// components/AvatarPickerModal.tsx
import { Modal, View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const avatarUrls = [
  'https://api.dicebear.com/6.x/bottts/svg?seed=dog',
  'https://api.dicebear.com/6.x/bottts/svg?seed=cat',
  'https://api.dicebear.com/6.x/bottts/svg?seed=lion',
  'https://api.dicebear.com/6.x/bottts/svg?seed=panda',
  'https://api.dicebear.com/6.x/bottts/svg?seed=rabbit',
  'https://api.dicebear.com/6.x/bottts/svg?seed=fox',
  'https://api.dicebear.com/6.x/bottts/svg?seed=koala',
  'https://api.dicebear.com/6.x/bottts/svg?seed=tiger',
  'https://api.dicebear.com/6.x/bottts/svg?seed=penguin',
];

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
}

export default function AvatarPickerModal({ visible, onClose, onSelect }: AvatarPickerModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSave = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Choose your avatar</Text>
          <ScrollView contentContainerStyle={styles.grid}>
            {avatarUrls.map((url, index) => (
              <Pressable key={index} onPress={() => setSelected(url)} style={styles.avatarWrapper}>
                <Image
                  source={{ uri: url }}
                  style={[
                    styles.avatar,
                    selected === url && styles.selectedAvatar
                  ]}
                />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.saveButton}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    borderColor: '#007aff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: '#888',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
