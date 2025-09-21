// app/companies/form.tsx (o donde prefieras)
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  useWindowDimensions, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';

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
  'image',
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
};

export default function CompanyForm() {
  const { companyId } = useLocalSearchParams<{ companyId?: string }>();
  const isEdit = !!companyId;

  const { width } = useWindowDimensions();
  const columns = useMemo(() => (width > 1000 ? 3 : width > 650 ? 2 : 1), [width]);
  const fieldWidth = useMemo(() => (columns === 1 ? '100%' : columns === 2 ? '48%' : '31%'), [columns]);

  const [fields, setFields] = useState<CompanyFields>(EMPTY_VALUES);
  const [initialValues, setInitialValues] = useState<CompanyFields>(EMPTY_VALUES);

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
      };

      setFields(loaded);
      setInitialValues(loaded);
      setErrors({});
      setSubmitted(false);
    })();
  }, [isEdit, companyId]);

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
    return JSON.stringify(fields) !== JSON.stringify(initialValues);
  }, [fields, initialValues]);

  const handleSubmit = async () => {
    saveCompany();
  };

  async function saveCompany() {
    setLoading(true);
    try {
      const row = {
        ...(isEdit ? { id: companyId } : {}), // si editas, pasas id; si creas, no
        ...fields,
        country_iso_code: fields.country_iso_code?.toUpperCase() ?? '',
      };

      const { error } = await supabase
        .from('companies')
        .upsert([row], { onConflict: 'id' }); // <- requiere PK/unique en id

      if (error) throw error;

      setFeedback({
        type: 'success',
        message: isEdit ? 'Company updated successfully!' : 'Company created successfully!',
      });

      if (isEdit) {
        setInitialValues(fields);
        setSubmitted(false);
        setErrors({});
      } else {
        setFields(EMPTY_VALUES);
        setInitialValues(EMPTY_VALUES);
        setSubmitted(false);
        setErrors({});
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message ?? 'Unexpected error.' });
    } finally {
      setLoading(false);
    }
  }


  if (loadingFetch) {
    return (
      <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading company…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEdit ? 'Edit Company' : 'Create New Company'}</Text>

      {feedback && (
        <Text style={feedback.type === 'success' ? styles.success : styles.error}>
          {feedback.message}
        </Text>
      )}

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
