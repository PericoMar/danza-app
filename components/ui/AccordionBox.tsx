import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  findNodeHandle,
  UIManager as RNUIManager,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Surface } from 'react-native-paper';

type AccordionBoxProps = {
  title: string;
  description: string;
  placeholder?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  toolboxInfo?: string;
};

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AccordionBox({
  title,
  description,
  placeholder,
  iconName = 'help-circle-outline',
  toolboxInfo = '',
}: AccordionBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [value, setValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<any>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
    Animated.timing(rotateAnim, {
      toValue: isCollapsed ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleTooltipOpen = () => {
    const node = findNodeHandle(iconRef.current);
    if (node) {
      RNUIManager.measure(node, (_x, _y, width, height, pageX, pageY) => {
        setTooltipPosition({ top: pageY + height + 8, left: pageX });
        setShowTooltip(true);
      });
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleAccordion} style={styles.header}>
        <Ionicons name={iconName} size={20} color="#000" />
        <Text style={styles.title}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color="#000" />
        </Animated.View>
      </Pressable>

      <Collapsible collapsed={isCollapsed}>
        <View style={styles.descriptionRow}>
          <Text style={styles.description}>{description}</Text>

          {toolboxInfo !== '' && (
            <Pressable
              ref={iconRef}
              onPress={handleTooltipOpen}
              style={styles.infoButton}
            >
              <Ionicons name="information-circle" size={16} color="white" />
            </Pressable>
          )}
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>
      </Collapsible>

      <Portal>
        {showTooltip && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowTooltip(false)}
          >
            <View
              pointerEvents="box-none"
              style={[
                styles.tooltipBox,
                {
                  top: tooltipPosition.top,
                  left: tooltipPosition.left,
                },
              ]}
            >
              <Surface style={styles.tooltipSurface}>
                <Text style={styles.tooltipText}>{toolboxInfo}</Text>
              </Surface>
            </View>
          </Pressable>
        )}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  descriptionRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  description: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  infoButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 50,
    padding: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  input: {
    flex: 1,
    height: 40,
    color: '#000',
  },
  tooltipBox: {
    position: 'absolute',
    zIndex: 9999,
  },
  tooltipSurface: {
    backgroundColor: '#000',
    borderRadius: 6,
    padding: 10,
    maxWidth: 250,
    elevation: 8,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
});
