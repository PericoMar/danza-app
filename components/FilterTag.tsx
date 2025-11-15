import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterTagProps {
  label?: string;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  activeIconName?: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({
  label,
  iconName,
  activeIconName,
  active,
  onPress,
}) => {
  const renderedIconName = active && activeIconName ? activeIconName : iconName;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tag,
        active && styles.activeTag,
        pressed && styles.pressedTag,
      ]}
    >
      <View style={styles.content}>
        {renderedIconName && (
          <Ionicons
            name={renderedIconName}
            size={14}
            color={active ? '#ffffff' : '#555'}
            style={label ? styles.iconWithLabel : undefined}
          />
        )}

        {label ? (
          <Text style={[styles.tagText, active && styles.activeTagText]}>
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  activeTag: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  pressedTag: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWithLabel: {
    marginRight: 4,
  },
  tagText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FilterTag;
