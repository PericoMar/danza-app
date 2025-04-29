import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AiSummaryModalProps {
  visible: boolean;
  onClose: () => void;
}

const sections = ['Company Summary', 'Salary Information', 'Operas Summary'];

export default function AiSummaryModal({ visible, onClose }: AiSummaryModalProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [animation] = useState(new Animated.Value(0));
  const { width } = useWindowDimensions();

  const isMobile = width < 480;
  const fontSize = isMobile ? 14 : 16;
  const titleFontSize = isMobile ? 18 : 20;

  const toggleSection = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection(prev => (prev === title ? null : title));
    animateText();
  };

  const animateText = () => {
    animation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animatedStyle = {
    opacity: animation,
  };

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <View style={[styles.dialogContainer, isMobile && styles.dialogMobile]}>
        <Text style={[styles.title, { fontSize: titleFontSize }]}>AI Summary</Text>

        <ScrollView style={styles.scroll}>
          {sections.map(section => (
            <View key={section}>
              <Pressable
                onPress={() => toggleSection(section)}
                style={styles.sectionHeader}
              >
                <Text style={[styles.sectionTitle, { fontSize }]}>{section}</Text>
                <Ionicons
                  name={openSection === section ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#333"
                />
              </Pressable>

              {openSection === section && (
                <View style={styles.sectionContent}>
                  <Animated.Text
                    style={[
                      styles.generatingText,
                      animatedStyle,
                      { fontSize: fontSize - 1 },
                    ]}
                  >
                    Generating summary...
                  </Animated.Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90%',
    alignSelf: 'center',
  },
  dialogMobile: {
    width: '100%',
    justifyContent: 'flex-start',
    borderRadius: 12,
  },
  scroll: {
    maxHeight: 300,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontWeight: '500',
    color: '#333',
  },
  sectionContent: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  generatingText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
