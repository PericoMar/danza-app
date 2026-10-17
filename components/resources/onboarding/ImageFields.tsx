import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import { accountStyles, webPointer } from '@/components/account';
import { pickImage } from '@/services/imagePicker';
import { buildImagePath, pickedImageName, uploadImage } from '@/services/storage';
import { IMMUTABLE_CACHE_CONTROL, STORAGE_BUCKETS } from '@/constants/storage';
import { RESOURCE_IMAGES_MAX, RESOURCE_STORAGE_FOLDER } from '@/constants/resources';
import type { ResourceImageDraft } from '@/utils/resourceOnboarding';

/**
 * Sube una imagen a `resources/<id>/…`, que es la única ruta del bucket donde
 * la policy de storage deja escribir al dueño de la ficha.
 */
async function uploadResourceImage(resourceId: string, square: boolean) {
  const file = await pickImage({ square });
  if (!file) return null;

  const path = buildImagePath(RESOURCE_STORAGE_FOLDER, pickedImageName(file), resourceId);
  return uploadImage(STORAGE_BUCKETS.MEDIA, path, file, {
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
}

interface LogoFieldProps {
  resourceId: string;
  logoUrl: string;
  onChange: (logoUrl: string) => void;
}

/** El logo o la foto que identifica la ficha en todo el directorio. */
export function LogoField({ resourceId, logoUrl, onChange }: LogoFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadResourceImage(resourceId, true);
      if (url) onChange(url);
    } catch (e: any) {
      setError(e?.message ?? 'The image could not be uploaded.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.logoRow}>
        <Pressable
          onPress={choose}
          accessibilityRole="button"
          accessibilityLabel={logoUrl ? 'Change logo' : 'Upload logo'}
          style={[styles.logoBox, webPointer]}
        >
          {busy ? (
            <ActivityIndicator color={Colors.text} />
          ) : logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={22} color={Colors.textMuted} />
          )}
        </Pressable>

        <View style={styles.logoActions}>
          <Pressable onPress={choose} accessibilityRole="button" style={[styles.pill, webPointer]}>
            <Text style={styles.pillLabel}>{logoUrl ? 'Replace' : 'Upload an image'}</Text>
          </Pressable>
          {logoUrl ? (
            <Pressable
              onPress={() => onChange('')}
              accessibilityRole="button"
              style={[styles.pill, webPointer]}
            >
              <Text style={styles.pillLabel}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={accountStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface GalleryFieldProps {
  resourceId: string;
  images: ResourceImageDraft[];
  onChange: (images: ResourceImageDraft[]) => void;
  /** Mínimo que pide su tipo (3 para un fotógrafo), para decirlo en pantalla. */
  minCount?: number | null;
}

/** La galería. Para un fotógrafo es la pantalla que le consigue el trabajo. */
export function GalleryField({ resourceId, images, onChange, minCount }: GalleryFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    if (busy || images.length >= RESOURCE_IMAGES_MAX) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadResourceImage(resourceId, false);
      if (url) onChange([...images, { image_url: url, caption: '' }]);
    } catch (e: any) {
      setError(e?.message ?? 'The image could not be uploaded.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));

  const missing = minCount ? Math.max(0, minCount - images.length) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {images.map((image, index) => (
          <View key={`${image.image_url}-${index}`} style={styles.thumbWrap}>
            <Image source={{ uri: image.image_url }} style={styles.thumb} resizeMode="cover" />
            <Pressable
              onPress={() => remove(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${index + 1}`}
              hitSlop={6}
              style={[styles.thumbRemove, webPointer]}
            >
              <Ionicons name="close" size={14} color={Colors.white} />
            </Pressable>
          </View>
        ))}

        {images.length < RESOURCE_IMAGES_MAX ? (
          <Pressable
            onPress={add}
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            style={[styles.addThumb, webPointer]}
          >
            {busy ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Ionicons name="add" size={22} color={Colors.textMuted} />
            )}
          </Pressable>
        ) : null}
      </View>

      {missing > 0 ? (
        <Text style={accountStyles.hintText}>
          {missing} more {missing === 1 ? 'photo' : 'photos'} to go.
        </Text>
      ) : null}
      {error ? <Text style={accountStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const THUMB = 92;

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoBox: {
    width: 86,
    height: 86,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    backgroundColor: Colors.chromeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoActions: {
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    alignSelf: 'flex-start',
  },
  pillLabel: {
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: '500',
    color: Colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.silverSoft,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  addThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ruleStrong,
    backgroundColor: Colors.specSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
