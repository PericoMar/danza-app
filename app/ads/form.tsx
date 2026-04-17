import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRole } from '@/providers/RoleProvider';
import { getAd, createAd, updateAd } from '@/services/ads';
import { uploadImage, buildImagePath } from '@/services/storage';
import ImageUploader from '@/components/ui/ImageUploader';
import DateInput from '@/components/common/DateInput';

const BUCKET = 'media';

type AdFields = {
  title: string;
  description: string;
  destination_url: string;
  active_from: string;
  active_until: string;
  image_url: string;
  image_url_desktop: string;
  published: boolean;
};

const EMPTY: AdFields = {
  title: '',
  description: '',
  destination_url: '',
  active_from: '',
  active_until: '',
  image_url: '',
  image_url_desktop: '',
  published: false,
};

export default function AdForm() {
  const { adId } = useLocalSearchParams<{ adId?: string }>();
  const isEdit = !!adId;
  const { isAdmin, loading: roleLoading } = useRole();

  const { width } = useWindowDimensions();
  const columns = useMemo(() => (width > 800 ? 2 : 1), [width]);
  const halfWidth: any = columns === 2 ? '48%' : '100%';

  const [fields, setFields] = useState<AdFields>(EMPTY);
  const [initialValues, setInitialValues] = useState<AdFields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [pendingFileDesktop, setPendingFileDesktop] = useState<File | null>(null);
  const [previewUrlDesktop, setPreviewUrlDesktop] = useState<string | null>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoadingFetch(true);
      try {
        const ad = await getAd(adId!);
        const loaded: AdFields = {
          title: ad.title ?? '',
          description: ad.description ?? '',
          destination_url: ad.destination_url ?? '',
          active_from: ad.active_from ? ad.active_from.slice(0, 10) : '',
          active_until: ad.active_until ? ad.active_until.slice(0, 10) : '',
          image_url: ad.image_url,
          image_url_desktop: ad.image_url_desktop ?? '',
          published: ad.published,
        };
        setFields(loaded);
        setInitialValues(loaded);
      } catch (e: any) {
        setFeedback({ type: 'error', message: e.message ?? 'Ad not found.' });
      } finally {
        setLoadingFetch(false);
      }
    })();
  }, [isEdit, adId]);

  const handleChange = (key: keyof AdFields, value: string | boolean) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (submitted) validate(next);
  };

  const handleFileSelected = (file: File) => {
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleFileSelectedDesktop = (file: File) => {
    setPendingFileDesktop(file);
    setPreviewUrlDesktop(URL.createObjectURL(file));
  };

  const validate = (values: AdFields = fields): boolean => {
    const errs: Record<string, string> = {};
    if (values.title.length > 100) errs.title = 'Max 100 characters.';
    if (values.description.length > 400) errs.description = 'Max 400 characters.';
    if (values.destination_url.length > 200) errs.destination_url = 'Max 200 characters.';
    if (!values.image_url && !pendingFile) errs.image = 'An image is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const hasChanges = useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initialValues) || !!pendingFile || !!pendingFileDesktop,
    [fields, initialValues, pendingFile, pendingFileDesktop]
  );

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!validate()) return;

    setLoading(true);
    try {
      let imageUrl = fields.image_url;
      let imageUrlDesktop = fields.image_url_desktop || null;

      if (pendingFile) {
        setUploading(true);
        const path = buildImagePath('ads', pendingFile.name);
        imageUrl = await uploadImage(BUCKET, path, pendingFile);
        setUploading(false);
      }

      if (pendingFileDesktop) {
        setUploadingDesktop(true);
        const path = buildImagePath('ads/desktop', pendingFileDesktop.name);
        imageUrlDesktop = await uploadImage(BUCKET, path, pendingFileDesktop);
        setUploadingDesktop(false);
      }

      const payload = {
        title: fields.title.trim() || null,
        description: fields.description.trim() || null,
        image_url: imageUrl,
        image_url_desktop: imageUrlDesktop,
        destination_url: fields.destination_url.trim() || null,
        active_from: fields.active_from || null,
        active_until: fields.active_until || null,
        published: fields.published,
      };

      if (isEdit) {
        await updateAd(adId!, payload);
      } else {
        await createAd(payload);
      }

      setFeedback({
        type: 'success',
        message: isEdit ? 'Ad updated successfully!' : 'Ad created successfully!',
      });

      const savedFields = { ...fields, image_url: imageUrl, image_url_desktop: imageUrlDesktop ?? '' };
      setFields(isEdit ? savedFields : EMPTY);
      setInitialValues(isEdit ? savedFields : EMPTY);
      setPendingFile(null);
      setPreviewUrl(null);
      setPendingFileDesktop(null);
      setPreviewUrlDesktop(null);
      setSubmitted(false);
      setErrors({});
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message ?? 'Unexpected error.' });
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadingDesktop(false);
    }
  };

  if (roleLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>You do not have permission to access this page.</Text>
      </View>
    );
  }

  if (loadingFetch) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading ad…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEdit ? 'Edit Ad' : 'Create New Ad'}</Text>

      {feedback && (
        <Text style={feedback.type === 'success' ? styles.success : styles.error}>
          {feedback.message}
        </Text>
      )}

      <View style={[styles.row, columns > 1 && styles.rowHorizontal]}>
        <View style={{ width: halfWidth }}>
          <Text style={styles.imageUploaderLabel}>Mobile Image *</Text>
          <ImageUploader
            currentImageUrl={fields.image_url}
            previewUrl={previewUrl}
            onFileSelected={handleFileSelected}
            isUploading={uploading}
            error={errors.image}
          />
        </View>
        <View style={{ width: halfWidth }}>
          <Text style={styles.imageUploaderLabel}>Desktop Image (optional)</Text>
          <ImageUploader
            currentImageUrl={fields.image_url_desktop || null}
            previewUrl={previewUrlDesktop}
            onFileSelected={handleFileSelectedDesktop}
            isUploading={uploadingDesktop}
          />
        </View>
      </View>

      <View style={[styles.row, columns > 1 && styles.rowHorizontal]}>
        <View style={{ width: halfWidth }}>
          <Input
            label="Title"
            value={fields.title}
            onChangeText={(v) => handleChange('title', v)}
            maxLength={100}
            error={errors.title}
            placeholder="e.g. Summer Audition Call"
          />
        </View>
        <View style={{ width: halfWidth }}>
          <Input
            label="Destination URL"
            value={fields.destination_url}
            onChangeText={(v) => handleChange('destination_url', v)}
            maxLength={200}
            error={errors.destination_url}
            placeholder="https://..."
          />
        </View>
      </View>

      <Input
        label="Description"
        value={fields.description}
        onChangeText={(v) => handleChange('description', v)}
        maxLength={400}
        multiline
        error={errors.description}
        placeholder="Short description of the ad..."
      />

      <View style={[styles.row, columns > 1 && styles.rowHorizontal]}>
        <View style={{ width: halfWidth }}>
          <DateInput
            label="Active From"
            value={fields.active_from}
            onChange={(v) => handleChange('active_from', v)}
            styles={inputStyles}
          />
        </View>
        <View style={{ width: halfWidth }}>
          <DateInput
            label="Active Until"
            value={fields.active_until}
            onChange={(v) => handleChange('active_until', v)}
            min={fields.active_from || undefined}
            styles={inputStyles}
          />
        </View>
      </View>

      <View style={styles.publishedRow}>
        <View>
          <Text style={styles.publishedLabel}>Published</Text>
          <Text style={styles.publishedHint}>
            {fields.published ? 'Visible to all users' : 'Only visible to admins (draft)'}
          </Text>
        </View>
        <Switch
          value={fields.published}
          onValueChange={(v) => handleChange('published', v as any)}
          trackColor={{ false: '#e0e0e0', true: '#4caf50' }}
          thumbColor="#fff"
        />
      </View>

      <Pressable
        style={[styles.submitButton, (loading || (isEdit && !hasChanges)) && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading || (isEdit && !hasChanges)}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{isEdit ? 'Save Changes' : 'Create Ad'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  maxLength,
  required,
  error,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  maxLength: number;
  required?: boolean;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={inputStyles.inputBox}>
      <Text style={inputStyles.label}>
        {label}
        {required && <Text style={{ color: '#d32f2f' }}>*</Text>}
      </Text>
      <TextInput
        style={[
          inputStyles.input,
          multiline && inputStyles.inputMultiline,
          error && inputStyles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        multiline={!!multiline}
        accessibilityLabel={label}
      />
      <View style={inputStyles.inputBottomRow}>
        <Text style={inputStyles.charCount}>
          {value.length}/{maxLength}
        </Text>
        {error && <Text style={inputStyles.inputErrorText}>{error}</Text>}
      </View>
    </View>
  );
}

// Shared styles exposed for DateInput's `styles` prop
export const inputStyles = StyleSheet.create({
  inputBox: {
    backgroundColor: '#fff',
    borderRadius: 11,
    padding: 10,
    shadowColor: '#aaa',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#ececec',
    width: '100%',
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 7,
    padding: 10,
    backgroundColor: '#f6f8fa',
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  inputBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
  },
  inputErrorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafbfc',
    width: '100%',
  },
  content: {
    padding: 22,
    maxWidth: 900,
    alignSelf: 'center',
    gap: 14,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#23272f',
    letterSpacing: -1,
    alignSelf: 'center',
  },
  row: {
    width: '100%',
    gap: 14,
  },
  rowHorizontal: {
    flexDirection: 'row',
  },
  imageUploaderLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111',
    marginBottom: 6,
  },
  publishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 11,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ececec',
    shadowColor: '#aaa',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  publishedLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111',
  },
  publishedHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#222',
    borderRadius: 9,
    paddingVertical: 13,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#111',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  error: {
    color: '#d32f2f',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  success: {
    color: '#32c671',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
});
