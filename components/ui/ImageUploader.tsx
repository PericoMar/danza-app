import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  currentImageUrl?: string | null;
  previewUrl?: string | null;
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  error?: string;
};

export default function ImageUploader({
  currentImageUrl,
  previewUrl,
  onFileSelected,
  isUploading,
  error,
}: Props) {
  const displayUrl = previewUrl ?? currentImageUrl;

  const handlePick = () => {
    if (Platform.OS !== 'web') return;
    // @ts-ignore - document is available on web
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) onFileSelected(file);
    };
    input.click();
  };

  return (
    <View style={[styles.container, error ? styles.containerError : null]}>
      <Text style={styles.label}>
        Image <Text style={{ color: '#d32f2f' }}>*</Text>
      </Text>

      <Pressable
        style={styles.pickerArea}
        onPress={handlePick}
        disabled={isUploading}
        accessibilityRole="button"
        accessibilityLabel="Select image"
      >
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color="#aaa" />
            <Text style={styles.placeholderText}>Click to select an image</Text>
          </View>
        )}

        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.uploadingText}>Uploading…</Text>
          </View>
        )}
      </Pressable>

      {displayUrl && !isUploading && (
        <Pressable style={styles.changeButton} onPress={handlePick} accessibilityRole="button">
          <Ionicons name="refresh-outline" size={16} color="#555" />
          <Text style={styles.changeButtonText}>Change image</Text>
        </Pressable>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ececec',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(170,170,170,0.07)' } as any,
      default: {
        shadowColor: '#aaa',
        shadowOpacity: 0.07,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
    }),
  },
  containerError: {
    borderColor: '#d32f2f',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
    color: '#111',
  },
  pickerArea: {
    borderWidth: 2,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  preview: {
    width: '100%',
    height: 200,
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  changeButtonText: {
    fontSize: 13,
    color: '#555',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
