// components/AccordionBox.tsx
import Collapsible from 'react-native-collapsible';
import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';

type AccordionBoxProps = {
  title: string;
  description: string;
  placeholder?: string;
};

export default function AccordionBox({ title, description, placeholder }: AccordionBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [value, setValue] = useState('');

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setIsCollapsed(!isCollapsed)}>
        <Text style={styles.title}>
          {title} {isCollapsed ? '+' : '-'}
        </Text>
      </Pressable>

      <Collapsible collapsed={isCollapsed}>
        <Text style={styles.description}>{description}</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#999"
          style={styles.input}
        />
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'YourCustomFont-Bold', // ← sustituye por tu fuente
    color: 'black',
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'YourCustomFont-Regular', // ← sustituye por tu fuente
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    color: 'black',
    fontFamily: 'YourCustomFont-Regular', // ← sustituye por tu fuente
  },
});
