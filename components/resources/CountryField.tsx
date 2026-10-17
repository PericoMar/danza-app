import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import type { Country } from '@/services/countries';

interface CountryFieldProps {
  countries: Country[];
  value: string;
  onChange: (isoCode: string) => void;
  placeholder?: string;
  /** Alto de los filtros del listado, más bajo que el de un campo de formulario. */
  compact?: boolean;
}

/**
 * Selector de país sobre la tabla `countries`. Lo comparten el onboarding
 * (donde el país decide las regiones que se ofrecen) y el filtro del
 * directorio.
 */
export default function CountryField({
  countries,
  value,
  onChange,
  placeholder = 'Pick your country',
  compact = false,
}: CountryFieldProps) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => countries.map((c) => ({ label: c.name, value: c.iso_code })),
    [countries]
  );

  return (
    <View style={{ zIndex: 60 }}>
      <DropDownPicker
        open={open}
        value={value || null}
        items={items}
        setOpen={setOpen as any}
        setValue={((cb: unknown) => {
          const next = typeof cb === 'function' ? (cb as any)(value) : cb;
          onChange(typeof next === 'string' ? next : '');
        }) as any}
        searchable
        placeholder={placeholder}
        searchPlaceholder="Search..."
        searchPlaceholderTextColor={Colors.textMuted}
        zIndex={60}
        zIndexInverse={20}
        listMode="SCROLLVIEW"
        style={[styles.dropdown, compact && styles.dropdownCompact]}
        placeholderStyle={styles.placeholder}
        labelStyle={styles.label}
        dropDownContainerStyle={styles.container}
        searchContainerStyle={styles.searchContainer}
        searchTextInputStyle={styles.searchInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    minHeight: 54,
    borderColor: Colors.panelBorder,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  dropdownCompact: {
    minHeight: 43,
    borderRadius: 8,
  },
  placeholder: {
    fontFamily: INTER,
    fontSize: 15,
    color: Colors.textMuted,
  },
  label: {
    fontFamily: INTER,
    fontSize: 15,
    color: Colors.text,
  },
  container: {
    borderColor: Colors.panelBorder,
    borderRadius: 14,
    // Explícito y no heredado de la librería: la lista flota sobre el
    // formulario y cualquier transparencia deja leer lo de debajo.
    backgroundColor: Colors.white,
  },
  searchContainer: {
    borderBottomColor: Colors.rule,
  },
  searchInput: {
    fontFamily: INTER,
    fontSize: 15,
    color: Colors.text,
    borderColor: Colors.panelBorder,
    borderRadius: 10,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
});
