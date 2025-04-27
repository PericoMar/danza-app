// src/components/FilterButton.tsx
import { Pressable, Text, StyleSheet, Platform } from 'react-native';

interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function FilterButton({ label, active, onPress }: FilterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, active && styles.activeButton, Platform.OS === 'web' && { cursor: 'pointer' }]}
    >
      <Text style={[styles.buttonText, active && styles.activeButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
  },
});
