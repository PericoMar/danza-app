import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';

const FIELD_LIMITS = {
  name: 64,
  description: 400,
  location: 64,
  website_url: 120,
  instagram_url: 120,
  meta_url: 120,
  country: 56,
  country_iso_code: 5,
  image: 512,
};

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
  name: "Company Name",
  description: "Description",
  image: "Image URL",
  location: "Location",
  website_url: "Website URL",
  instagram_url: "Instagram URL",
  meta_url: "Meta URL",
  country: "Country",
  country_iso_code: "Country ISO Code",
};

export default function CompanyForm() {
  const { width } = useWindowDimensions();

  const columns = useMemo(() => {
    if (width > 1000) return 3;
    if (width > 650) return 2;
    return 1;
  }, [width]);

  const fieldWidth = useMemo(() => {
    return columns === 1 ? '100%' : columns === 2 ? '48%' : '31%';
  }, [columns]);

  const [fields, setFields] = useState({
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
  });

  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | { type: 'success' | 'error'; message: string }>(null);

  const handleChange = (key: keyof typeof FIELD_LIMITS, value: string) => {
    setFields({ ...fields, [key]: value });
    if (submitted) validate({ ...fields, [key]: value });
  };

  const validate = (values = fields) => {
    const newErrors: { [k: string]: string } = {};
    if (!values.name.trim()) newErrors.name = "Company name is required.";
    if (values.name.length > FIELD_LIMITS.name) newErrors.name = `Max ${FIELD_LIMITS.name} chars.`;
    if (values.description.length > FIELD_LIMITS.description) newErrors.description = `Max ${FIELD_LIMITS.description} chars.`;
    if (values.location.length > FIELD_LIMITS.location) newErrors.location = `Max ${FIELD_LIMITS.location} chars.`;
    if (values.website_url.length > FIELD_LIMITS.website_url) newErrors.website_url = `Max ${FIELD_LIMITS.website_url} chars.`;
    if (values.instagram_url.length > FIELD_LIMITS.instagram_url) newErrors.instagram_url = `Max ${FIELD_LIMITS.instagram_url} chars.`;
    if (values.meta_url.length > FIELD_LIMITS.meta_url) newErrors.meta_url = `Max ${FIELD_LIMITS.meta_url} chars.`;
    if (values.country.length > FIELD_LIMITS.country) newErrors.country = `Max ${FIELD_LIMITS.country} chars.`;
    if (values.country_iso_code.length > FIELD_LIMITS.country_iso_code) newErrors.country_iso_code = `Use ISO 2-letter code.`;
    if (values.image.length > FIELD_LIMITS.image) newErrors.image = `Max ${FIELD_LIMITS.image} chars.`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setFeedback(null);
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase
      .from('companies')
      .insert([fields]);

    setLoading(false);
    if (error) {
      setFeedback({ type: 'error', message: error.message || 'Error uploading company.' });
    } else {
      setFeedback({ type: 'success', message: 'Company created successfully!' });
      setFields({
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
      });
      setSubmitted(false);
      setErrors({});
    }
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create New Company</Text>
      {feedback && (
        <Text style={feedback.type === 'success' ? styles.success : styles.error}>
          {feedback.message}
        </Text>
      )}

      <View style={[styles.grid, { flexDirection: columns > 1 ? 'row' : 'column', flexWrap: 'wrap' }]}>
        {FIELD_LAYOUT.map((key, i) => (
          <View key={key} style={[styles.gridItem, { width: fieldWidth, marginRight: columns > 1 && (i + 1) % columns !== 0 ? '2%' : 0 }]}>
            <Input
              label={FIELD_LABELS[key]}
              value={fields[key]}
              onChangeText={val => handleChange(key, key === 'country_iso_code' ? val.toUpperCase() : val)}
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
        onChangeText={val => handleChange('description', val)}
        maxLength={FIELD_LIMITS.description}
        multiline
        error={errors.description}
        placeholder="Short company description..."
      />

      <Pressable style={[styles.submitButton, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitButtonText}>Create Company</Text>
        }
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
        {label}
        {required && <Text style={{ color: '#d32f2f' }}>*</Text>}
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
        placeholderTextColor="#aaa"
        multiline={!!multiline}
      />
      <View style={styles.inputBottomRow}>
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
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
