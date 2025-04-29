// components/Sidebar.tsx
import { View, Text, Pressable, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const sidebarWidth = screenWidth > 768 ? 300 : screenWidth;

  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      onClose();
    });
  
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? screenWidth - sidebarWidth : screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, screenWidth, sidebarWidth]);
  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    router.replace('/login'); // O simplemente router.push('/login')
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          transform: [{ translateX: slideAnim }],
          left: 0,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close-outline" size={28} color="black" />
        </Pressable>
      </View>

      <View style={styles.menu}>
        <Pressable style={styles.menuItem} onPress={() => { onClose(); router.push('/companies'); }}>
          <Ionicons name="business-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Companies</Text>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => { onClose(); router.push('/profile'); }}>
          <Ionicons name="person-outline" size={22} color="#333" />
          <Text style={styles.menuText}>My Profile</Text>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => { onClose(); router.push('/companies'); }}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#333" />
          <Text style={styles.menuText}>My Reviews</Text>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Logout</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    elevation: 10, // sombra Android
    shadowColor: '#000', // sombra iOS
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 100,
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menu: {
    padding: 20,
    gap: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});
