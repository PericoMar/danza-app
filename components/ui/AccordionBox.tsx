import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
  findNodeHandle,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import { Portal } from 'react-native-paper';

type AccordionBoxProps = {
  title: string;
  description: string;
  placeholder?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  toolboxInfo?: string;
  value: string;
  onChangeText: (text: string) => void;
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
  value,
  onChangeText
}: AccordionBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  const iconRef = useRef<View>(null);
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

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  useEffect(() => {
    if (showTooltip && iconRef.current) {
      iconRef.current?.measureInWindow?.((x, y) => {
        setTooltipPosition({
          top: y,
          left: x,
        });
      });

    }
  }, [showTooltip]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => {
      // Remover el listener al desmontar
      subscription.remove();
    };
  }, []);

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
          {toolboxInfo !== '' && (
            <>
              <View ref={iconRef}>
                <Pressable onPress={() => setShowTooltip(true)} style={styles.infoButtonCustom}>
                  <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
                  {screenWidth >= 600 && (
                    <Text style={styles.infoButtonText}>Info</Text>
                  )}
                </Pressable>
              </View>


              {showTooltip && (
                <Portal>
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setShowTooltip(false)}
                  >
                    <View pointerEvents="box-none">
                      <View
                        style={[
                          styles.tooltipBoxCustom,
                          {
                            top: tooltipPosition.top - 60,
                            left: tooltipPosition.left,
                          },
                        ]}
                      >
                        <Text style={styles.tooltipTextCustom}>{toolboxInfo}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Portal>
              )}
            </>
          )}

          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            style={styles.textArea}
            multiline
            numberOfLines={4}
          />
        </View>
      </Collapsible>
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
    gap: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  infoButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: '#007AFF',
    borderWidth: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  infoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },

  tooltipBoxCustom: {
    position: 'absolute',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    maxWidth: 250,
    elevation: 8,
    zIndex: 9999,
  },
  tooltipTextCustom: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
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
  textArea: {
    flex: 1,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#000',
  },
});
