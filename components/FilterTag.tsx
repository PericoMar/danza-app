import React from 'react';
import { Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/theme/colors';
import { INTER, CHROME_GRADIENT_START, CHROME_GRADIENT_END } from '@/theme/companies';

interface FilterTagProps {
  label?: string;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  activeIconName?: React.ComponentProps<typeof Ionicons>['name'];
  /** Small leading dot (design "Upcoming auditions" pill). */
  leadingDot?: boolean;
  /** Trailing count badge. */
  count?: number | string;
  active: boolean;
  /** Favourites pill goes dark-metallic when active instead of flat black. */
  variant?: 'default' | 'fav';
  /** Tighter padding — used for icon-only pills on narrow screens. */
  compact?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

const FilterTag: React.FC<FilterTagProps> = ({
  label,
  iconName,
  activeIconName,
  leadingDot,
  count,
  active,
  variant = 'default',
  compact = false,
  onPress,
  accessibilityLabel,
}) => {
  const renderedIconName = active && activeIconName ? activeIconName : iconName;
  const contentColor = active ? Colors.white : Colors.text;
  const showFavGradient = active && variant === 'fav';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ hovered }) => [
        styles.tag,
        compact && styles.tagCompact,
        active && styles.tagActive,
        !active && hovered && styles.tagHovered,
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
      ]}
    >
      {showFavGradient && (
        <LinearGradient
          colors={Gradients.darkPill.colors}
          locations={Gradients.darkPill.locations}
          start={CHROME_GRADIENT_START}
          end={CHROME_GRADIENT_END}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={[styles.content, compact && styles.contentCompact]}>
        {leadingDot && (
          <View style={[styles.dot, { backgroundColor: contentColor }]} />
        )}

        {renderedIconName && (
          <Ionicons
            name={renderedIconName}
            size={13}
            color={contentColor}
            style={label ? styles.iconWithLabel : undefined}
          />
        )}

        {label ? (
          <Text style={[styles.tagText, { color: contentColor }]}>{label}</Text>
        ) : null}

        {count !== undefined && count !== '' && (
          <Text style={[styles.count, { color: contentColor }]}>{count}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  tagCompact: {
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  contentCompact: {
    gap: 5,
  },
  tagActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tagHovered: {
    borderColor: Colors.text,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWithLabel: {
    marginRight: -2,
  },
  tagText: {
    fontFamily: INTER,
    fontSize: 13,
    letterSpacing: 0.1,
    fontWeight: '500',
  },
  count: {
    fontFamily: INTER,
    fontSize: 10,
    letterSpacing: 1,
    opacity: 0.65,
  },
});

export default FilterTag;
