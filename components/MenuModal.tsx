// components/Sidebar.tsx
import { View, Text, Pressable, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import Modal from 'react-native-modal';

interface MenuPopoverProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function MenuPopoverProps({ isVisible, onClose }: MenuPopoverProps) {
  const router = useRouter();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      onClose();
    });
  
    return () => {
      subscription.remove();
    };
  }, []);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    router.replace('/login'); // O simplemente router.push('/login')
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      backdropOpacity={0}
      animationIn="fadeIn"
      animationOut="fadeOut"
      style={styles.modal}
    >
      <View style={styles.popover}>
        <Pressable style={styles.item} onPress={() => { onClose(); router.push('/companies'); }}>
          <Ionicons name="business-outline" size={18} color="#333" />
          <Text style={styles.text}>Companies</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={() => { onClose(); router.push('/profile'); }}>
          <Ionicons name="person-outline" size={18} color="#333" />
          <Text style={styles.text}>My Profile</Text>
        </Pressable>

<Pressable style={styles.item} onPress={() => { onClose(); router.push('/my-reviews'); }}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#333" />
          <Text style={styles.text}>My Reviews</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#333" />
          <Text style={styles.text}>Logout</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    margin: 0,
    paddingTop: Platform.OS === 'web' ? 50 : 60, // ajusta la posición vertical
    paddingRight: 10,
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
    gap: 12,
    minWidth: 180,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 15,
    color: '#333',
  },
});
