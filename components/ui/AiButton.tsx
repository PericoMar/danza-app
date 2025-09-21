import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type AiButtonProps = {
  isGenerating: boolean;
  onPress: () => void;
};

export default function AiButton({ isGenerating, onPress }: AiButtonProps) {
  return (
    <LinearGradient
      colors={['#00E5FF','#00ADEF','#32D234','#F5E03F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}
    >
      <Pressable
        style={({ pressed }) => [
          styles.aiButton,
          isGenerating && { opacity: 0.6 },
          pressed && { opacity: 0.8 },
        ]}
        onPress={onPress}
        disabled={isGenerating}
      >
        <Ionicons name="sparkles" size={20} color="black" />
        <Text style={styles.aiButtonText}>
          {isGenerating ? 'Generating…' : 'Generate AI Summary'}
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 24,
    padding: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  aiButtonText: {
    color: 'black',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 16,
  },
});
