import { StyleSheet, Text, View } from 'react-native';
import SegmentedTabs, { type SegmentedTab } from '@/components/common/SegmentedTabs';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

type PreviewToolbarProps<K extends string> = {
  /** Small uppercase label before the tabs, e.g. "Preview as". */
  label: string;
  tabs: readonly SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel: string;
};

/** The row above a design picker that sets what every preview shows. */
export default function PreviewToolbar<K extends string>({
  label,
  tabs,
  value,
  onChange,
  accessibilityLabel,
}: PreviewToolbarProps<K>) {
  return (
    <View style={styles.toolbar}>
      <Text style={styles.label}>{label}</Text>
      <SegmentedTabs tabs={tabs} value={value} onChange={onChange} accessibilityLabel={accessibilityLabel} />
    </View>
  );
}

/** The small print under a design picker. */
export const previewNoteStyles = StyleSheet.create({
  note: {
    fontFamily: INTER,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  strong: {
    fontWeight: '700',
    color: Colors.text,
  },
});

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
});
