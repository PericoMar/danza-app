// components/companies/CompanyForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  useWindowDimensions, ActivityIndicator, Platform
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import ImageUploader from '@/components/ui/ImageUploader';
import { useFileDownload } from '@/hooks/useFileDownload';
import { buildDownloadFilename } from '@/utils/downloadFilename';
import { uploadImage, deleteImage, buildImagePath, extractStoragePath, pickedImageName } from '@/services/storage';
import { compressImage } from '@/services/imageCompression';
import type { PickedImage } from '@/types/media';
import {
  CompanyType,
  COMPANY_TYPE_OPTIONS,
  ProfessionalEducationLevel,
  PROFESSIONAL_EDUCATION_LEVEL_OPTIONS,
} from '@/types/company';
import SiteHeader from '@/components/common/SiteHeader';
import { STORAGE_BUCKETS } from '@/constants/storage';

const LOGO_BUCKET = STORAGE_BUCKETS.MEDIA;

function previewUriFor(image: PickedImage): string {
  return Platform.OS === 'web' ? URL.createObjectURL(image as File) : (image as { uri: string }).uri;
}

const FIELD_LIMITS = {
  name: 64,
  description: 400,
  location: 64,
  website_url: 120,
  instagram_url: 120,
  meta_url: 120,
  country: 56,
  country_iso_code: 6,
  image: 512,
} as const;

const FIELD_LAYOUT: (keyof typeof FIELD_LIMITS)[] = [
  'name',
  'location',
  'country',
  'country_iso_code',
  'website_url',
  'instagram_url',
  'meta_url',
];

const FIELD_LABELS: Record<string, string> = {
  name: 'Company Name',
  description: 'Description',
  image: 'Image URL',
  location: 'Location',
  website_url: 'Website URL',
  instagram_url: 'Instagram URL',
  meta_url: 'Meta URL',
  country: 'Country',
  country_iso_code: 'Country ISO Code',
};

type CompanyFields = {
  name: string;
  description: string;
  image: string;
  location: string;
  website_url: string;
  instagram_url: string;
  meta_url: string;
  country: string;
  country_iso_code: string;
  verified: boolean;
  type: CompanyType;
  is_junior: boolean;
  professional_education_level: ProfessionalEducationLevel | null;
};

const EMPTY_VALUES: CompanyFields = {
  name: '',
  description: '',
  image: '',
  location: '',
  website_url: '',
  instagram_url: '',
  meta_url: '',
  country: '',
  country_iso_code: '',
  verified: true,
  type: CompanyType.COMPANY,
  is_junior: false,
  professional_education_level: null,
};

export default function CompanyForm() {
  const { companyId } = useLocalSearchParams<{ companyId?: string }>();
  const isEdit = !!companyId;

  const { width } = useWindowDimensions();
  const columns = useMemo(() => (width > 1000 ? 3 : width > 650 ? 2 : 1), [width]);
  const fieldWidth = useMemo(() => (columns === 1 ? '100%' : columns === 2 ? '48%' : '31%'), [columns]);

  const [fields, setFields] = useState<CompanyFields>(EMPTY_VALUES);
  const [initialValues, setInitialValues] = useState<CompanyFields>(EMPTY_VALUES);

  const [pendingLogo, setPendingLogo] = useState<PickedImage | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { download, downloading: downloadingLogo } = useFileDownload();

  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);          // submit loading
  const [loadingFetch, setLoadingFetch] = useState(false); // fetch loading for edit
  const [feedback, setFeedback] = useState<null | { type: 'success' | 'error'; message: string }>(null);

  // Load data if editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoadingFetch(true);
      setFeedback(null);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      setLoadingFetch(false);
      if (error || !data) {
        setFeedback({ type: 'error', message: error?.message ?? 'Company not found.' });
        return;
      }

      // Map DB record to fields (ajusta si tus nombres difieren)
      const loaded: CompanyFields = {
        name: data.name ?? '',
        description: data.description ?? '',
        image: data.image ?? '',
        location: data.location ?? '',
        website_url: data.website_url ?? '',
        instagram_url: data.instagram_url ?? '',
        meta_url: data.meta_url ?? '',
        country: data.country ?? '',
        country_iso_code: (data.country_iso_code ?? '').toUpperCase(),
        verified: data.verified ?? true,
        type: (data.type as CompanyType) ?? CompanyType.COMPANY,
        is_junior: data.is_junior ?? false,
        professional_education_level:
          (data.professional_education_level as ProfessionalEducationLevel) ?? null,
      };

      setFields(loaded);
      setInitialValues(loaded);
      setPendingLogo(null);
      setLogoPreview(null);
      setErrors({});
      setSubmitted(false);
    })();
  }, [isEdit, companyId]);

  const handleLogoSelected = (image: PickedImage) => {
    setPendingLogo(image);
    setLogoPreview(previewUriFor(image));
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleLogoDownload = async () => {
    try {
      await download(fields.image, buildDownloadFilename(fields.name, 'logo', fields.image));
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message ?? 'Could not download the logo.' });
    }
  };

  const handleChange = (key: keyof typeof FIELD_LIMITS, value: string) => {
    const v = key === 'country_iso_code' ? value.toUpperCase() : value;
    const next = { ...fields, [key]: v };
    setFields(next);
    if (submitted) validate(next);
  };

  const validate = (values: CompanyFields = fields) => {
    const newErrors: { [k: string]: string } = {};
    if (!values.name.trim()) newErrors.name = 'Company name is required.';
    if (values.name.length > FIELD_LIMITS.name) newErrors.name = `Max ${FIELD_LIMITS.name} chars.`;
    if (values.description.length > FIELD_LIMITS.description) newErrors.description = `Max ${FIELD_LIMITS.description} chars.`;
    if (values.location.length > FIELD_LIMITS.location) newErrors.location = `Max ${FIELD_LIMITS.location} chars.`;
    if (values.website_url.length > FIELD_LIMITS.website_url) newErrors.website_url = `Max ${FIELD_LIMITS.website_url} chars.`;
    if (values.instagram_url.length > FIELD_LIMITS.instagram_url) newErrors.instagram_url = `Max ${FIELD_LIMITS.instagram_url} chars.`;
    if (values.meta_url.length > FIELD_LIMITS.meta_url) newErrors.meta_url = `Max ${FIELD_LIMITS.meta_url} chars.`;
    if (values.country.length > FIELD_LIMITS.country) newErrors.country = `Max ${FIELD_LIMITS.country} chars.`;
    if (values.country_iso_code.length > 0 && values.country_iso_code.length < 2) {
      newErrors.country_iso_code = 'Use ISO 2-letter code.';
    }
    if (values.country_iso_code.length > FIELD_LIMITS.country_iso_code) {
      newErrors.country_iso_code = 'Use ISO 2-letter code.';
    }
    if (values.image.length > FIELD_LIMITS.image) newErrors.image = `Max ${FIELD_LIMITS.image} chars.`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = useMemo(() => {
    return JSON.stringify(fields) !== JSON.stringify(initialValues) || !!pendingLogo;
  }, [fields, initialValues, pendingLogo]);

  const handleSubmit = async () => {
    saveCompany();
  };

  async function saveCompany() {
    setLoading(true);
    try {
      let imageUrl = fields.image;
      let newLogoPath: string | null = null;

      if (pendingLogo) {
        setUploadingLogo(true);
        const logo = await compressImage(pendingLogo, { maxSize: 512 });
        const path = buildImagePath('companies', pickedImageName(logo), isEdit ? String(companyId) : undefined);
        imageUrl = await uploadImage(LOGO_BUCKET, path, logo);
        newLogoPath = path;
        setUploadingLogo(false);
      }

      const row = {
        ...(isEdit ? { id: companyId } : {}), // si editas, pasas id; si creas, no
        ...fields,
        image: imageUrl,
        country_iso_code: fields.country_iso_code?.toUpperCase() ?? '',
      };

      const { error } = await supabase
        .from('companies')
        .upsert([row], { onConflict: 'id' }); // <- requiere PK/unique en id

      if (error) {
        // The DB never ended up pointing at the new logo — don't leave it orphaned.
        if (newLogoPath) {
          try { await deleteImage(LOGO_BUCKET, newLogoPath); } catch { /* non-fatal */ }
        }
        throw error;
      }

      // DB write confirmed — now it's safe to remove the previous logo, if it changed.
      if (newLogoPath) {
        const oldPath =
          initialValues.image && initialValues.image !== imageUrl
            ? extractStoragePath(initialValues.image, LOGO_BUCKET)
            : null;
        if (oldPath) {
          try { await deleteImage(LOGO_BUCKET, oldPath); } catch { /* non-fatal */ }
        }
      }

      setFeedback({
        type: 'success',
        message: isEdit ? 'Company updated successfully!' : 'Company created successfully!',
      });

      const savedFields = { ...fields, image: imageUrl };

      if (isEdit) {
        setFields(savedFields);
        setInitialValues(savedFields);
        setPendingLogo(null);
        setLogoPreview(null);
        setSubmitted(false);
        setErrors({});
      } else {
        setFields(EMPTY_VALUES);
        setInitialValues(EMPTY_VALUES);
        setPendingLogo(null);
        setLogoPreview(null);
        setSubmitted(false);
        setErrors({});
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message ?? 'Unexpected error.' });
    } finally {
      setLoading(false);
      setUploadingLogo(false);
    }
  }


  if (loadingFetch) {
    return (
      <>
        <SiteHeader />
        <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading company…</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEdit ? 'Edit Company' : 'Create New Company'}</Text>

      {feedback && (
        <Text style={feedback.type === 'success' ? styles.success : styles.error}>
          {feedback.message}
        </Text>
      )}

      <View style={{ maxWidth: 340, width: '100%', marginBottom: 8 }}>
        <Text style={styles.label}>Company Logo</Text>
        <ImageUploader
          currentImageUrl={fields.image || null}
          previewUrl={logoPreview}
          onImageSelected={handleLogoSelected}
          isUploading={uploadingLogo}
          error={errors.image}
        />
        {/* Downloads the saved logo; hidden while a new one is pending so the
            preview and the downloaded file never disagree. */}
        {!!fields.image && !pendingLogo && (
          <Pressable
            style={[styles.downloadButton, downloadingLogo && { opacity: 0.6 }]}
            onPress={handleLogoDownload}
            disabled={downloadingLogo}
            accessibilityRole="button"
            accessibilityLabel="Download company logo"
          >
            {downloadingLogo
              ? <ActivityIndicator size="small" color="#111827" />
              : <Ionicons name="download-outline" size={16} color="#111827" />}
            <Text style={styles.downloadButtonText}>Download logo</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.grid, { flexDirection: columns > 1 ? 'row' : 'column', flexWrap: 'wrap' }]}>
        {FIELD_LAYOUT.map((key, i) => (
          <View
            key={key}
            style={[
              styles.gridItem,
              { width: fieldWidth, marginRight: columns > 1 && (i + 1) % columns !== 0 ? '2%' : 0 },
            ]}
          >
            <Input
              label={FIELD_LABELS[key]}
              value={(fields as any)[key] ?? ''}
              onChangeText={(val) => handleChange(key, val)}
              maxLength={FIELD_LIMITS[key]}
              required={key === 'name'}
              error={errors[key]}
              placeholder={
                key === 'name' ? 'e.g. Royal Ballet'
                  : key === 'description' ? 'Short company description...'
                    : key === 'country_iso_code' ? 'ES'
                      : key === 'country' ? 'e.g. Spain'
                        : key === 'image' ? 'https://...'
                          : key === 'instagram_url' ? 'https://instagram.com/...'
                            : key === 'website_url' ? 'https://...'
                              : ''
              }
            />
          </View>
        ))}
      </View>

      <Input
        label="Description"
        value={fields.description}
        onChangeText={(val) => handleChange('description', val)}
        maxLength={FIELD_LIMITS.description}
        multiline
        error={errors.description}
        placeholder="Short company description..."
      />

      <View style={styles.inputBox}>
        <Text style={styles.label}>Classification</Text>
        <View style={styles.typeChips}>
          {COMPANY_TYPE_OPTIONS.map((opt) => (
            <ModeChip
              key={opt.value}
              label={opt.label}
              active={fields.type === opt.value}
              onPress={() =>
                setFields((prev) => ({
                  ...prev,
                  type: opt.value,
                  is_junior: opt.value === CompanyType.COMPANY ? prev.is_junior : false,
                  professional_education_level:
                    opt.value === CompanyType.PROFESSIONAL_EDUCATION
                      ? prev.professional_education_level
                      : null,
                }))
              }
            />
          ))}
        </View>
      </View>

      {fields.type === CompanyType.COMPANY && (
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setFields((prev) => ({ ...prev, is_junior: !prev.is_junior }))}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: fields.is_junior }}
          accessibilityLabel="Is Junior company"
        >
          <View style={[styles.checkbox, fields.is_junior && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>Is Junior</Text>
        </Pressable>
      )}

      {fields.type === CompanyType.PROFESSIONAL_EDUCATION && (
        <View style={styles.inputBox}>
          <Text style={styles.label}>Professional Education Level</Text>
          <View style={styles.typeChips}>
            {PROFESSIONAL_EDUCATION_LEVEL_OPTIONS.map((opt) => (
              <ModeChip
                key={opt.value}
                label={opt.label}
                active={fields.professional_education_level === opt.value}
                accessibilityRole="radio"
                onPress={() =>
                  setFields((prev) => ({ ...prev, professional_education_level: opt.value }))
                }
              />
            ))}
          </View>
        </View>
      )}

      <Pressable
        style={[
          styles.submitButton,
          (loading || (isEdit && !hasChanges)) && { opacity: 0.6 },
        ]}
        onPress={handleSubmit}
        disabled={loading || (isEdit && !hasChanges)}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Save company changes' : 'Create company'}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.submitButtonText}>
            {isEdit ? 'Save Changes' : 'Create Company'}
          </Text>
        )}
      </Pressable>
      </ScrollView>
    </>
  );
}

function ModeChip({
  label,
  active,
  onPress,
  accessibilityRole = 'button',
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityRole?: 'button' | 'radio';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={
        accessibilityRole === 'radio' ? { checked: active } : { selected: active }
      }
      style={[styles.modeChip, active && styles.modeChipActive]}
    >
      <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{label}</Text>
    </Pressable>
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
  onChangeText: (val: string) => void;
  maxLength: number;
  required?: boolean;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>
        {label}{required && <Text style={{ color: '#d32f2f' }}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        multiline={!!multiline}
        accessibilityLabel={label}
      />
      <View style={styles.inputBottomRow}>
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
        {error && <Text style={styles.inputErrorText}>{error}</Text>}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafbfc',
    width: '100%',
  },
  content: {
    padding: 22,
    maxWidth: 1100,
    alignSelf: 'center',
    gap: 14,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#23272f',
    letterSpacing: -1,
    alignSelf: 'center',
  },
  grid: {
    width: '100%',
    marginBottom: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 0,
  },
  gridItem: {
    marginBottom: 12,
    minWidth: 160,
  },
  inputBox: {
    marginBottom: 0,
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
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9ca3af',
    backgroundColor: 'transparent',
  },
  modeChipActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#9ca3af',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
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
