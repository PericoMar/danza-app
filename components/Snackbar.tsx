// src/components/Snackbar.tsx
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';

interface SnackbarProps {
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  color?: string;
  duration?: number; // en milisegundos
  onClose?: () => void;
}

export default function Snackbar({
  message,
  iconName,
  color = '#007AFF', // Azul por defecto
  duration = 3000,
  onClose,
}: SnackbarProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animación de entrada
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Animación de la barra de progreso
    Animated.timing(progress, {
      toValue: 0,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onClose?.();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={[styles.snackbar, { borderLeftColor: color }]}>
        {iconName && (
          <Ionicons name={iconName} size={20} color={color} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.message}>{message}</Text>
        <Pressable onPress={handleClose}>
          <Ionicons name="close" size={20} color="#888" />
        </Pressable>
      </View>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            transform: [{ scaleX: progress }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'flex-end',
    width: '40%',
    zIndex: 1000,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderLeftWidth: 4,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    transformOrigin: 'left',
  },
});
