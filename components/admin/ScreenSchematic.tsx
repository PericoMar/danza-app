import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/theme/colors';

type ScreenSchematicProps = {
  /** Dims the drawn page, as a modal's backdrop would. */
  isDimmed?: boolean;
  /** What floats over the page, absolutely positioned by the caller. */
  children?: ReactNode;
};

/**
 * A tiny drawing of a page (navbar, a heading, three cards) for design pickers
 * to place an overlay on, so each option shows at a glance where it sits.
 */
export default function ScreenSchematic({ isDimmed = false, children }: ScreenSchematicProps) {
  return (
    <View style={styles.screen} accessible={false}>
      <View style={styles.navbar} />
      <View style={styles.page}>
        <View style={[styles.line, { width: '46%' }]} />
        <View style={[styles.line, { width: '30%' }]} />
        <View style={styles.cards}>
          <View style={styles.card} />
          <View style={styles.card} />
          <View style={styles.card} />
        </View>
      </View>
      {isDimmed && <View style={styles.scrim} />}
      {children}
    </View>
  );
}

/** Shared marks for the overlays drawn on a schematic. */
export const schematicStyles = StyleSheet.create({
  line: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.skeletonFill,
  },
  lineOnDark: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.specDivider,
    backgroundColor: Colors.specSurface,
    overflow: 'hidden',
  },
  navbar: {
    height: '11%',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  page: {
    flex: 1,
    padding: '6%',
    gap: 5,
  },
  line: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.skeletonFill,
  },
  cards: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  card: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
});
