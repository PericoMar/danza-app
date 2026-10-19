import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

export type DesignOptionTag = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

type DesignOptionCardProps = {
  name: string;
  pitch: string;
  /** A small drawing of the design, e.g. on a ScreenSchematic. */
  thumbnail: ReactNode;
  tag: DesignOptionTag;
  /** The design real visitors get right now. */
  isLive: boolean;
  /** Currently open as a preview. */
  isOpen: boolean;
  width: number;
  onPreview: () => void;
};

/** One option of an admin design picker: drawing, name, pitch, and a tap to try it. */
export default function DesignOptionCard({
  name,
  pitch,
  thumbnail,
  tag,
  isLive,
  isOpen,
  width,
  onPreview,
}: DesignOptionCardProps) {
  return (
    <Pressable
      onPress={onPreview}
      accessibilityRole="button"
      accessibilityLabel={`Preview the ${name} design`}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.card,
        { width },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
        (hovered || isOpen) && styles.cardActive,
      ]}
    >
      {thumbnail}

      <View style={styles.titleRow}>
        <Text style={styles.name}>{name}</Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>
      <Text style={styles.pitch}>{pitch}</Text>

      <View style={styles.footer}>
        <View style={styles.tag}>
          <Ionicons name={tag.icon} size={12} color={Colors.grey2} />
          <Text style={styles.tagText}>{tag.label}</Text>
        </View>
        <View style={styles.previewLink}>
          <Ionicons name={isOpen ? 'eye' : 'eye-outline'} size={14} color={Colors.text} />
          <Text style={styles.previewText}>{isOpen ? 'Showing' : 'Preview'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    backgroundColor: Colors.white,
    ...Platform.select({
      web: { transition: 'border-color 0.15s, box-shadow 0.15s' } as object,
    }),
  },
  cardActive: {
    borderColor: Colors.silver,
    ...Platform.select({
      web: { boxShadow: '0 18px 42px -22px rgba(0,0,0,.18)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
        elevation: 2,
      },
    }),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.auditionOpenBg,
    borderWidth: 1,
    borderColor: Colors.auditionOpenBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.auditionOpenText,
  },
  liveText: {
    fontFamily: INTER,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.auditionOpenText,
  },
  pitch: {
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagText: {
    fontFamily: INTER,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  previewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  previewText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
