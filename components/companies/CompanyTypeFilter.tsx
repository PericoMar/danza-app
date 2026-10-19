import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import {
  COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH,
  COMPANIES_SELECTOR_DEFAULT_WIDTH,
  COMPANIES_SELECTOR_MIN_WIDTH,
  COMPANIES_SELECTOR_HEIGHT,
  COMPANY_TYPE_PANEL_MIN_WIDTH,
  COMPANY_TYPE_PANEL_PREFERRED_HEIGHT,
  COMPANY_TYPE_PANEL_OFFSET,
  COMPANY_TYPE_PANEL_SCREEN_MARGIN,
  COMPANY_TYPE_SHEET_MAX_HEIGHT_RATIO,
} from '@/constants/layout';
import type { CompanySubtypeGroup, CompanySubtypeId } from '@/types/company';

interface CompanyTypeFilterProps {
  width: number;
  /** Override the trigger's default width (e.g. shrunk to match the country
   * selector so both fit on one line on narrow phones). */
  triggerWidth?: number;
  /** The catalogue: each type is a heading, its subtypes are what gets ticked. */
  groups: CompanySubtypeGroup[];
  value: CompanySubtypeId[];
  onChange: (value: CompanySubtypeId[]) => void;
}

interface Anchor {
  left: number;
  width: number;
  /** Set when the panel opens below the trigger: distance from the screen top. */
  top?: number;
  /** Set when it opens above: distance from the screen bottom. */
  bottom?: number;
  maxHeight: number;
}

/** Where the popover goes for a trigger at (x, y, w, h) on a screen of that size. */
function placePanel(
  trigger: { x: number; y: number; w: number; h: number },
  screen: { width: number; height: number },
): Anchor {
  const width = Math.max(trigger.w, COMPANY_TYPE_PANEL_MIN_WIDTH);
  // Wider than its trigger, so pulled left rather than run off the screen.
  const left = Math.max(
    COMPANY_TYPE_PANEL_SCREEN_MARGIN,
    Math.min(trigger.x, screen.width - width - COMPANY_TYPE_PANEL_SCREEN_MARGIN),
  );
  const roomBelow =
    screen.height - (trigger.y + trigger.h + COMPANY_TYPE_PANEL_OFFSET) - COMPANY_TYPE_PANEL_SCREEN_MARGIN;
  const roomAbove = trigger.y - COMPANY_TYPE_PANEL_OFFSET - COMPANY_TYPE_PANEL_SCREEN_MARGIN;

  if (roomBelow >= COMPANY_TYPE_PANEL_PREFERRED_HEIGHT || roomBelow >= roomAbove) {
    return { left, width, top: trigger.y + trigger.h + COMPANY_TYPE_PANEL_OFFSET, maxHeight: roomBelow };
  }
  return {
    left,
    width,
    bottom: screen.height - trigger.y + COMPANY_TYPE_PANEL_OFFSET,
    maxHeight: roomAbove,
  };
}

/**
 * Multi-select "type" dropdown: the subtypes, listed under their type headings.
 * Renders its panel through `Portal` (same mechanism as MenuModal/SiteNavbar)
 * so it always floats above the sticky filter bar and results grid, regardless
 * of stacking context — and switches to a full-width bottom sheet on narrow
 * screens instead of a small anchored popover, which would be fiddly to tap
 * accurately on a phone.
 */
export default function CompanyTypeFilter({
  width,
  triggerWidth = COMPANIES_SELECTOR_DEFAULT_WIDTH,
  groups,
  value,
  onChange,
}: CompanyTypeFilterProps) {
  const sheetMode = width <= COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const labels = useMemo(
    () => new Map(groups.flatMap((group) => group.subtypes.map((s) => [s.id, s.label] as const))),
    [groups],
  );

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);

  const openPanel = () => {
    if (sheetMode) {
      setOpen(true);
      return;
    }
    triggerRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      setAnchor(
        placePanel({ x: pageX, y: pageY, w, h }, { width: windowWidth, height: windowHeight }),
      );
      setOpen(true);
    });
  };

  const close = () => setOpen(false);

  const toggle = (id: CompanySubtypeId) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selectedLabel =
    value.length === 0
      ? 'All types'
      : value.length === 1
        ? labels.get(value[0]) ?? '1 type'
        : `${value.length} types`;

  const renderOptions = () =>
    groups.map((group) => (
      <View key={group.id} style={styles.group}>
        <Text style={styles.groupLabel} accessibilityRole="header">
          {group.label}
        </Text>
        {group.subtypes.map((subtype) => {
          const checked = value.includes(subtype.id);
          return (
            <Pressable
              key={subtype.id}
              onPress={() => toggle(subtype.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              style={({ hovered }) => [styles.optionRow, hovered && styles.optionRowHovered]}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Ionicons name="checkmark" size={13} color={Colors.white} />}
              </View>
              <Text style={styles.optionLabel}>{subtype.label}</Text>
            </Pressable>
          );
        })}
      </View>
    ));

  return (
    <View style={[styles.wrap, { width: triggerWidth }]}>
      <Pressable
        ref={triggerRef}
        onPress={openPanel}
        accessibilityRole="button"
        accessibilityLabel="Filter by company type"
        accessibilityState={{ expanded: open }}
        style={({ hovered }) => [
          styles.trigger,
          value.length > 0 && styles.triggerSelected,
          hovered && styles.triggerHovered,
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
        ]}
      >
        <Text
          style={[styles.triggerText, value.length === 0 && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        {value.length === 0 && (
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        )}
      </Pressable>

      {value.length > 0 && (
        <Pressable
          onPress={() => onChange([])}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear type filter"
          style={({ hovered }) => [
            styles.clear,
            Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
            hovered && styles.clearHovered,
          ]}
        >
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </Pressable>
      )}

      {open && (
        <Portal>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close type filter"
          />

          {sheetMode ? (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Filter by type</Text>
              <ScrollView style={{ maxHeight: windowHeight * COMPANY_TYPE_SHEET_MAX_HEIGHT_RATIO }}>
                {renderOptions()}
              </ScrollView>
              <Pressable onPress={close} style={styles.sheetDone} accessibilityRole="button">
                <Text style={styles.sheetDoneText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.panel,
                {
                  top: anchor?.top,
                  bottom: anchor?.bottom,
                  left: anchor?.left ?? 0,
                  width: anchor?.width ?? COMPANY_TYPE_PANEL_MIN_WIDTH,
                  maxHeight: anchor?.maxHeight,
                },
              ]}
            >
              <ScrollView style={styles.panelOptions}>{renderOptions()}</ScrollView>
              <View style={styles.panelDivider} />
              <Pressable
                onPress={() => onChange([])}
                disabled={value.length === 0}
                style={styles.panelClear}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.panelClearText, value.length === 0 && styles.panelClearTextDisabled]}
                >
                  Clear selection
                </Text>
              </Pressable>
            </View>
          )}
        </Portal>
      )}
    </View>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25)' },
  default: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
}) as object;

const styles = StyleSheet.create({
  wrap: {
    width: COMPANIES_SELECTOR_DEFAULT_WIDTH,
    minWidth: COMPANIES_SELECTOR_MIN_WIDTH,
    flexShrink: 1,
  },
  trigger: {
    minHeight: COMPANIES_SELECTOR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.bg,
  },
  triggerSelected: {
    // Leaves room for the inline clear button that overlays this corner.
    paddingRight: 40,
  },
  triggerHovered: {
    borderColor: Colors.text,
  },
  triggerText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.text,
  },
  triggerPlaceholder: {
    color: Colors.text,
  },
  clear: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearHovered: {
    opacity: 0.6,
  },
  panel: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
    paddingVertical: 6,
    ...shadow,
  },
  panelOptions: {
    flexShrink: 1,
  },
  panelDivider: {
    height: 1,
    backgroundColor: Colors.rule,
    marginVertical: 4,
  },
  panelClear: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  panelClearText: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  panelClearTextDisabled: {
    opacity: 0.4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    ...shadow,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.ruleStrong,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: INTER,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  sheetDone: {
    marginTop: 10,
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetDoneText: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  group: {
    paddingBottom: 4,
  },
  groupLabel: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    paddingTop: 10,
    paddingBottom: 2,
    paddingHorizontal: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionRowHovered: {
    backgroundColor: Colors.neutralLight,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  optionLabel: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.text,
  },
});
