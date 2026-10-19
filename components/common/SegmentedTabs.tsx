import { useRef, type ComponentProps } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";

export type SegmentedTab<K extends string> = {
  key: K;
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
};

type SegmentedTabsProps<K extends string> = {
  tabs: readonly SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
};

/**
 * Switches between the views of one page. A soft track with the open tab in
 * solid black — the same active state as a pill, so it reads as one family,
 * but boxed in so it doesn't pass for a row of filters.
 *
 * When the tabs don't fit (a phone, or simply many of them) the track scrolls
 * sideways, and it opens scrolled to the selected tab so a link to the last
 * one doesn't land with it out of sight.
 */
export default function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedTabsProps<K>) {
  const scrollRef = useRef<ScrollView>(null);
  const revealed = useRef(false);

  // Only the first layout: afterwards the user is the one scrolling.
  const revealSelected = (event: LayoutChangeEvent) => {
    if (revealed.current) return;
    revealed.current = true;
    const x = Math.max(0, event.nativeEvent.layout.x - REVEAL_MARGIN);
    scrollRef.current?.scrollTo({ x, animated: false });
  };

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.track} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
        {tabs.map((tab) => {
          const selected = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              onLayout={selected ? revealSelected : undefined}
              accessibilityRole="tab"
              aria-selected={selected}
              style={({ hovered }) => [
                styles.tab,
                selected && styles.tabSelected,
                !selected && hovered && styles.tabHovered,
                Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
              ]}
            >
              {({ hovered }) => {
                const color = selected ? Colors.white : hovered ? Colors.text : Colors.textLightDark;
                return (
                  <>
                    {tab.icon ? <Ionicons name={tab.icon} size={15} color={color} /> : null}
                    <Text style={[styles.label, { color }]}>{tab.label}</Text>
                  </>
                );
              }}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** How much of the previous tab stays in view when the track opens scrolled. */
const REVEAL_MARGIN = 24;

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.chromeSoft,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabSelected: {
    backgroundColor: Colors.text,
  },
  tabHovered: {
    backgroundColor: Colors.white,
  },
  label: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: "600",
  },
});
