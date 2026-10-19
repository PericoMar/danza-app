import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

type PageBackgroundSwatchProps = {
  name: string;
  hex: string;
  selected: boolean;
  /** Marks the colour the site uses when nobody picked one. */
  isDefault?: boolean;
  onPress: () => void;
};

/**
 * One candidate background, drawn as a tiny page: header, headline and a
 * company card, which takes the same colour and only keeps its hairline.
 */
export default function PageBackgroundSwatch({
  name,
  hex,
  selected,
  isDefault = false,
  onPress,
}: PageBackgroundSwatchProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={`${name}, ${hex}`}
      style={({ hovered }) => [
        styles.card,
        !selected && hovered && styles.cardHovered,
        selected && styles.cardSelected,
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
      ]}
    >
      <View style={[styles.page, { backgroundColor: hex }]}>
        <View style={styles.nav}>
          <View style={styles.navMark} />
          <View style={styles.navCta} />
        </View>
        <View style={styles.headline} />
        <View style={styles.subline} />
        <View style={[styles.paper, { backgroundColor: hex }]}>
          <View style={styles.paperLine} />
          <View style={[styles.paperLine, styles.paperLineShort]} />
        </View>
      </View>

      <View style={styles.meta}>
        <View style={styles.metaText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {isDefault ? <Text style={styles.defaultTag}>Default</Text> : null}
          </View>
          <Text style={styles.hex}>{hex}</Text>
        </View>
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={13} color={Colors.white} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  cardHovered: {
    borderColor: Colors.silver,
  },
  cardSelected: {
    borderColor: Colors.text,
  },
  page: {
    height: 108,
    padding: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  navMark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text,
  },
  navCta: {
    width: 20,
    height: 7,
    borderRadius: 2,
    backgroundColor: Colors.text,
  },
  headline: {
    width: '62%',
    height: 7,
    borderRadius: 2,
    backgroundColor: Colors.text,
  },
  subline: {
    width: '42%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  paper: {
    marginTop: 'auto',
    padding: 7,
    gap: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
  },
  paperLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.silverSoft,
  },
  paperLineShort: {
    width: '55%',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaText: {
    flexShrink: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  defaultTag: {
    fontFamily: INTER,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  hex: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.text,
  },
});
