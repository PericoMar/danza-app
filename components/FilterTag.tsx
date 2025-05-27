import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

interface FilterTagProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ label, active, onPress }) => {
  return (
    <Pressable onPress={onPress} style={[styles.tag, active && styles.activeTag]}>
      <Text style={[styles.tagText, active && styles.activeTagText]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Lighter border color for inactive state
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9', // Light background for inactive state
  },
  activeTag: {
    backgroundColor: '#333', // A vibrant blue for active state
    borderColor: '#555',
  },
  tagText: {
    color: '#555', // Darker gray for good contrast on light background
    fontSize: 14,
    fontWeight: '500',
  },
  activeTagText: {
    color: '#ffffff', // White text for contrast on active background
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FilterTag;
