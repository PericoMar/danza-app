import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import DesignOptionCard, { type DesignOptionTag } from './DesignOptionCard';

export type DesignOption<K extends string> = {
  key: K;
  name: string;
  pitch: string;
  thumbnail: ReactNode;
  tag: DesignOptionTag;
};

type DesignPickerProps<K extends string> = {
  options: DesignOption<K>[];
  /** The design real visitors get right now. */
  liveKey: K;
  /** The design open as a preview, if any. */
  openKey: K | null;
  onPreview: (key: K) => void;
};

const GRID_GAP = 14;
const MIN_CARD_WIDTH = 240;

/** A grid of candidate designs, two across when there's room, each one a tap away from a preview. */
export default function DesignPicker<K extends string>({
  options,
  liveKey,
  openKey,
  onPreview,
}: DesignPickerProps<K>) {
  const [gridWidth, setGridWidth] = useState(0);
  const columns = gridWidth >= MIN_CARD_WIDTH * 2 + GRID_GAP ? 2 : 1;
  const cardWidth = (gridWidth - GRID_GAP * (columns - 1)) / columns;

  return (
    <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
      {/* Cards wait for the measured width, so they never flash at the wrong size. */}
      {gridWidth > 0 &&
        options.map((option) => (
          <DesignOptionCard
            key={option.key}
            name={option.name}
            pitch={option.pitch}
            thumbnail={option.thumbnail}
            tag={option.tag}
            isLive={option.key === liveKey}
            isOpen={option.key === openKey}
            width={cardWidth}
            onPreview={() => onPreview(option.key)}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});
