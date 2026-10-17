import { StyleSheet, View } from 'react-native';
import FilterTag from '@/components/FilterTag';

export type ChipOption<V extends string> = { value: V; label: string };

interface SelectChipsProps<V extends string> {
  options: ChipOption<V>[];
  selected: V[];
  onChange: (next: V[]) => void;
  /** Tope de selecciones (3 regiones, por ejemplo). Al llegar, deseleccionar es la única salida. */
  max?: number;
  /** Solo una: elegir otra sustituye a la anterior. */
  single?: boolean;
}

/**
 * Selección múltiple con las píldoras del resto de la app (`FilterTag`), que
 * ya se pintan en negro cuando están activas. Lo usan disciplinas, objetivos
 * del alumno, tipos de trabajo del fotógrafo y regiones.
 */
export default function SelectChips<V extends string>({
  options,
  selected,
  onChange,
  max,
  single = false,
}: SelectChipsProps<V>) {
  const toggle = (value: V) => {
    if (single) {
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }

    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      return;
    }

    if (max !== undefined && selected.length >= max) return;
    onChange([...selected, value]);
  };

  return (
    <View style={styles.row}>
      {options.map((option) => (
        <FilterTag
          key={option.value}
          label={option.label}
          active={selected.includes(option.value)}
          onPress={() => toggle(option.value)}
          accessibilityLabel={option.label}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
