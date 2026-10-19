import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountSection, AccountTextField, accountStyles } from '@/components/account';
import PageBackgroundSwatch from '@/components/admin/PageBackgroundSwatch';
import { usePageBackground } from '@/hooks/usePageBackground';
import { normalizeHexColor } from '@/utils/pageBackground';
import { PAGE_BACKGROUND_DEFAULT, PAGE_BACKGROUND_PRESETS } from '@/constants/pageBackground';
import { Colors } from '@/theme/colors';

const SWATCH_GAP = 14;

/** The "Appearance" tab of /admin/settings: try another page background. */
export default function AppearanceSettingsPanel({ isWide }: { isWide: boolean }) {
  const { color, choose, isSupported } = usePageBackground();
  const isPreset = PAGE_BACKGROUND_PRESETS.some((preset) => preset.hex === color);
  const [customText, setCustomText] = useState(isPreset ? '' : color);
  const [customTouched, setCustomTouched] = useState(false);

  const columns = isWide ? PAGE_BACKGROUND_PRESETS.length : 2;
  const rows = Array.from({ length: Math.ceil(PAGE_BACKGROUND_PRESETS.length / columns) }, (_, i) =>
    PAGE_BACKGROUND_PRESETS.slice(i * columns, (i + 1) * columns),
  );

  const choosePreset = (hex: string) => {
    setCustomText('');
    setCustomTouched(false);
    choose(hex);
  };

  // A custom colour goes live the moment it is a complete hex; until then the
  // page keeps the last one that was.
  const changeCustom = (text: string) => {
    setCustomText(text);
    const hex = normalizeHexColor(text);
    if (hex) choose(hex);
  };

  const customError =
    customTouched && customText.trim() !== '' && !normalizeHexColor(customText)
      ? 'Six hex digits, like #F8F3E8.'
      : null;

  return (
    <AccountSection
      index="01"
      title="Background colour"
      description="The colour behind every page, the company cards and the filters. Pop-ups and form fields stay white."
      isWide={isWide}
    >
      {isSupported ? (
        <>
          <View accessibilityRole="radiogroup" accessibilityLabel="Background colour" style={styles.grid}>
            {rows.map((row) => (
              <View key={row[0].hex} style={styles.row}>
                {row.map((preset) => (
                  <PageBackgroundSwatch
                    key={preset.hex}
                    name={preset.name}
                    hex={preset.hex}
                    isDefault={preset.hex === PAGE_BACKGROUND_DEFAULT}
                    selected={preset.hex === color}
                    onPress={() => choosePreset(preset.hex)}
                  />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.custom}>
            <AccountTextField
              label="Or any other colour"
              value={customText}
              onChangeText={changeCustom}
              placeholder="#F8F3E8"
              icon="color-fill-outline"
              hint={
                !isPreset
                  ? `In use: ${color}. It applies as soon as the six digits are in.`
                  : 'A hex code. It applies as soon as the six digits are in.'
              }
              error={customError}
              inputProps={{
                maxLength: 7,
                autoCapitalize: 'characters',
                autoCorrect: false,
                onBlur: () => setCustomTouched(true),
              }}
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={[accountStyles.hintText, styles.noteText]}>
              Only this browser sees it: it isn't saved for anyone else and no data changes. Pick
              White to go back.
            </Text>
          </View>
        </>
      ) : (
        <Text style={accountStyles.bodyText}>
          Background try-outs run in the web app. Open Danza App in a browser to compare colours.
        </Text>
      )}
    </AccountSection>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: SWATCH_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: SWATCH_GAP,
  },
  custom: {
    maxWidth: 360,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
  },
});
