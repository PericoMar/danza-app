import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

// 👇 Tipo exportable para uso externo
export type VisibilityType = 'public' | 'anonymous' | 'non-visible' | null;

type VisibilityTagsProps = {
  value: VisibilityType;
  onChange: (value: VisibilityType) => void;
};

export default function VisibilityTags({ value, onChange }: VisibilityTagsProps) {
  const handlePress = (tag: Exclude<VisibilityType, null>) => {
    onChange(value === tag ? null : tag);
  };

  const getMessage = () => {
    switch (value) {
      case 'non-visible':
        return 'Your review will be private. Only the AI will have access to your input.';
      case 'anonymous':
        return 'Your review will be public, but your username will not be shown.';
      case 'public':
        return 'Your review and your username will be public.';
      default:
        return '';
    }
  };

  return (
    <View>
      <Text style={styles.label}>Visibility of your review</Text>
      <View style={styles.tagRow}>
        <Pressable
          style={[styles.tag, value === 'public' && styles.selectedTag]}
          onPress={() => handlePress('public')}
        >
          <Ionicons name="earth-outline" size={16} color="#28a745" />
          <Text style={styles.tagText}>Public</Text>
        </Pressable>

        <Pressable
          style={[styles.tag, value === 'anonymous' && styles.selectedTag]}
          onPress={() => handlePress('anonymous')}
        >
          <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
          <Text style={styles.tagText}>Anonymous</Text>
        </Pressable>

        <Pressable
          style={[styles.tag, value === 'non-visible' && styles.selectedTag]}
          onPress={() => handlePress('non-visible')}
        >
          <Ionicons name="eye-off-outline" size={16} color="#ff9900" />
          <Text style={styles.tagText}>Non-visible</Text>
        </Pressable>
      </View>

      {!!getMessage() && (
        <Text style={styles.message}>{getMessage()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginLeft: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
    shadowColor: 'transparent',
  },
  selectedTag: {
    backgroundColor: '#e0e4f7',
    borderColor: '#555',
  },
  tagText: {
    fontSize: 14,
    color: '#000',
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    color: '#555',
    maxWidth: 260,
  },
});
