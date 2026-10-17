import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import { AccountTextField, accountStyles, webPointer } from '@/components/account';
import { RESOURCE_EMAILS_MAX, RESOURCE_EMAIL_LABEL_MAX_CHARS } from '@/constants/resources';
import { emptyResourceEmail, type ResourceEmailDraft } from '@/utils/resourceOnboarding';
import { isValidEmail } from '@/utils/validation';

interface EmailsFieldProps {
  emails: ResourceEmailDraft[];
  onChange: (emails: ResourceEmailDraft[]) => void;
  placeholder?: string;
}

/**
 * Los emails de contacto de una ficha. El primero es el que se ve primero, y
 * por eso no hay que reordenar aquí: se añaden en el orden en que importan.
 */
export default function EmailsField({ emails, onChange, placeholder }: EmailsFieldProps) {
  const rows = emails.length > 0 ? emails : [emptyResourceEmail()];

  const update = (index: number, patch: Partial<ResourceEmailDraft>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <View style={styles.wrap}>
      {rows.map((row, index) => {
        const invalid = row.email.trim() !== '' && !isValidEmail(row.email.trim());

        return (
          <View key={index} style={styles.row}>
            <View style={styles.inputs}>
              <AccountTextField
                label={index === 0 ? 'Email' : `Email ${index + 1}`}
                value={row.email}
                onChangeText={(value) => update(index, { email: value })}
                placeholder={placeholder}
                icon="mail-outline"
                error={invalid ? 'That does not look like an email address.' : null}
                inputProps={{ autoCapitalize: 'none', keyboardType: 'email-address' }}
              />

              {rows.length > 1 || row.label !== '' ? (
                <AccountTextField
                  label="What it is for (optional)"
                  value={row.label}
                  onChangeText={(value) => update(index, { label: value })}
                  placeholder="Bookings"
                  hint="Empty: dancers just see the address."
                  inputProps={{ maxLength: RESOURCE_EMAIL_LABEL_MAX_CHARS }}
                />
              ) : null}
            </View>

            {rows.length > 1 ? (
              <Pressable
                onPress={() => remove(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove email ${index + 1}`}
                hitSlop={8}
                style={[styles.remove, webPointer]}
              >
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {rows.length < RESOURCE_EMAILS_MAX ? (
        <Pressable
          onPress={() => onChange([...rows, emptyResourceEmail()])}
          accessibilityRole="button"
          style={[styles.add, webPointer]}
        >
          <Ionicons name="add" size={15} color={Colors.text} />
          <Text style={styles.addLabel}>Add another email</Text>
        </Pressable>
      ) : (
        <Text style={accountStyles.hintText}>
          {RESOURCE_EMAILS_MAX} is as many as we show on a profile.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  inputs: {
    flex: 1,
    gap: 14,
  },
  remove: {
    marginTop: 34,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chromeSoft,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    ...Platform.select({ web: {}, default: {} }),
  },
  addLabel: {
    fontFamily: INTER,
    fontSize: 13.5,
    fontWeight: '500',
    color: Colors.text,
  },
});
