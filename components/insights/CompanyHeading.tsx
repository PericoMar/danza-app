import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FlagCdn } from '@/components/ui/FlagCdn';
import CompanyLogoTile from '@/components/insights/CompanyLogoTile';
import CountryLink from '@/components/companies/CountryLink';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER } from '@/theme/insights';
import { countryPath } from '@/constants/routes';
import { HeadingLevel } from '@/constants/headings';
import {
  MOBILE_BREAKPOINT,
  INSIGHTS_LOGO_SIZE,
  INSIGHTS_LOGO_SIZE_COMPACT,
  INSIGHTS_TITLE_FONT,
  INSIGHTS_TITLE_FONT_COMPACT,
} from '@/constants/layout';
import { slugify } from '@/utils/slug';

const FLAG_SIZE = 18;
const TITLE_LINE_HEIGHT = 1.1; // × font size
const NAME_LETTER_SPACING = -0.9;

interface CompanyHeadingProps {
  name: string;
  imageUrl: string | null;
  country: string | null;
  countryIsoCode: string | null;
  location: string | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * Top of a company's page: the logo beside the company's name (the page's
 * <h1>), with its country and address below it — on one line, or stacked
 * on mobile.
 */
export default function CompanyHeading({
  name,
  imageUrl,
  country,
  countryIsoCode,
  location,
  style,
}: CompanyHeadingProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < MOBILE_BREAKPOINT;
  const titleFont = isCompact ? INSIGHTS_TITLE_FONT_COMPACT : INSIGHTS_TITLE_FONT;

  return (
    <View style={style}>
      <View style={styles.identity}>
        <CompanyLogoTile
          name={name}
          imageUrl={imageUrl}
          size={isCompact ? INSIGHTS_LOGO_SIZE_COMPACT : INSIGHTS_LOGO_SIZE}
        />

        <View style={styles.text}>
          <Text
            style={[styles.name, { fontSize: titleFont, lineHeight: titleFont * TITLE_LINE_HEIGHT }]}
            accessibilityRole="header"
            aria-level={HeadingLevel.PAGE}
          >
            {name}
          </Text>

          <View style={[styles.meta, isCompact && styles.metaStacked]}>
            {(!!countryIsoCode || !!country) && (
              <View style={styles.countryRow}>
                {!!countryIsoCode && <FlagCdn iso={countryIsoCode} size={FLAG_SIZE} style={styles.flag} />}
                {!!country && (
                  <CountryLink
                    country={country}
                    href={countryPath(slugify(country))}
                    textStyle={[styles.metaText, styles.country]}
                  />
                )}
              </View>
            )}
            {(!!location || !country) && (
              <Text style={[styles.metaText, !isCompact && styles.location]}>
                {!!country && !isCompact && <Text style={styles.separator}>{'·  '}</Text>}
                {location ?? 'Location unknown'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  name: {
    fontFamily: DISPLAY,
    fontWeight: '800',
    letterSpacing: NAME_LETTER_SPACING,
    color: Colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaStacked: {
    flexDirection: 'column',
    gap: 2,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexShrink: 1,
  },
  // Centres the flag on the first line of the 14/20 text beside it.
  flag: {
    marginTop: 4,
    flexShrink: 0,
  },
  metaText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  country: {
    fontWeight: '600',
    color: Colors.text,
  },
  location: {
    flex: 1,
  },
  separator: {
    color: Colors.silver,
  },
});
