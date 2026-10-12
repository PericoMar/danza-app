import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import {
  COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH,
  COMPANIES_SELECTOR_DEFAULT_WIDTH,
  COMPANIES_SELECTOR_MIN_WIDTH,
  COMPANIES_SELECTOR_HEIGHT,
} from '@/constants/layout';
import { CompanyType, COMPANY_TYPE_OPTIONS } from '@/types/company';

interface CompanyTypeFilterProps {
  width: number;
  /** Override the trigger's default width (e.g. shrunk to match the country
   * selector so both fit on one line on narrow phones). */
  triggerWidth?: number;
  value: CompanyType[];
  onChange: (value: CompanyType[]) => void;
}

interface Anchor {
  top: number;
  left: number;
  width: number;
}

/**
 * Multi-select "type" dropdown. Renders its panel through `Portal` (same
 * mechanism as MenuModal/SiteNavbar) so it always floats above the sticky
 * filter bar and results grid, regardless of stacking context — and switches
 * to a full-width bottom sheet on narrow screens instead of a small anchored
 * popover, which would be fiddly to tap accurately on a phone.
 */
export default function CompanyTypeFilter({
  width,
  triggerWidth = COMPANIES_SELECTOR_DEFAULT_WIDTH,
  value,
  onChange,
}: CompanyTypeFilterProps) {
  const sheetMode = width <= COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH;

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);

  const openPanel = () => {
    if (sheetMode) {
      setOpen(true);
      return;
    }
    triggerRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      setAnchor({ top: pageY + h + 8, left: pageX, width: w });
      setOpen(true);
    });
  };

  const close = () => setOpen(false);

  const toggle = (type: CompanyType) => {
    onChange(value.includes(type) ? value.filter((t) => t !== type) : [...value, type]);
  };

  const selectedLabel =
    value.length === 0
      ? 'All types'
      : value.length === 1
        ? COMPANY_TYPE_OPTIONS.find((o) => o.value === value[0])?.label ?? 'All types'
        : `${value.length} types`;

  const renderOptions = () =>
    COMPANY_TYPE_OPTIONS.map((opt) => {
      const checked = value.includes(opt.value);
      return (
        <Pressable
          key={opt.value}
          onPress={() => toggle(opt.value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          style={({ hovered }) => [styles.optionRow, hovered && styles.optionRowHovered]}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Ionicons name="checkmark" size={13} color={Colors.white} />}
          </View>
          <Text style={styles.optionLabel}>{opt.label}</Text>
        </Pressable>
      );
    });

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
              {renderOptions()}
              <Pressable onPress={close} style={styles.sheetDone} accessibilityRole="button">
                <Text style={styles.sheetDoneText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.panel,
                {
                  top: anchor?.top ?? 0,
                  left: anchor?.left ?? 0,
                  width: Math.max(anchor?.width ?? 0, 220),
                },
              ]}
            >
              {renderOptions()}
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
    backgroundColor: Colors.white,
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
