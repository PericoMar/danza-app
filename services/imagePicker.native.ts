import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { PickedImage } from '@/types/media';

export type PickImageOptions = {
  /** Crop to a square in the system editor before returning. */
  square?: boolean;
};

/**
 * Opens the photo library for a single image, asking for permission first.
 * Resolves with the picked asset, or null when cancelled or not allowed.
 */
export async function pickImage({ square = false }: PickImageOptions = {}): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission needed',
      'Please allow access to your photo library to select an image.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: square,
    ...(square ? { aspect: [1, 1] as [number, number] } : {}),
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? asset.uri.split('/').pop() ?? `image-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
    width: asset.width,
    height: asset.height,
  };
}
