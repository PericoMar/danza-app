import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/insights';

interface CompanyAdminActionsProps {
  companyId: string;
}

type AdminAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  pathname: '/companies/[companyId]/edit' | '/companies/[companyId]/delete' | '/companies/[companyId]/auditions';
  fill: string;
};

const ACTIONS: AdminAction[] = [
  { key: 'edit', label: 'Edit company', icon: 'pencil', pathname: '/companies/[companyId]/edit', fill: Colors.white },
  { key: 'delete', label: 'Delete company', icon: 'trash', pathname: '/companies/[companyId]/delete', fill: Colors.dangerSoft },
  { key: 'auditions', label: 'Auditions', icon: 'musical-notes', pathname: '/companies/[companyId]/auditions', fill: Colors.purpleLight },
];

/** Admin-only company management shortcuts (design's ".admin" column). */
export default function CompanyAdminActions({ companyId }: CompanyAdminActionsProps) {
  const router = useRouter();

  return (
    <View style={styles.column}>
      {ACTIONS.map(({ key, label, icon, pathname, fill }) => (
        <Pressable
          key={key}
          onPress={() => router.push({ pathname, params: { companyId } })}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[
            styles.button,
            { backgroundColor: fill },
            Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
          ]}
        >
          <Ionicons name={icon} size={14} color={Colors.text} />
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    marginTop: 26,
    alignItems: 'flex-start',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
  },
  label: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
