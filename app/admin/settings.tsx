import { useEffect } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import RequireAdmin from '@/components/common/RequireAdmin';
import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import { AccountHero, AccountSection, accountStyles } from '@/components/account';
import HeroRingSettings from '@/components/admin/HeroRingSettings';
import { loadCompaniesFonts, pageHPadding } from '@/theme/companies';
import { PROFILE_CONTENT_MAX_WIDTH, TABLET_BREAKPOINT } from '@/constants/layout';
import { HERO_RING_MAX_IMAGES } from '@/constants/heroRing';

/** Admin-only app configuration. Each setting is one numbered section. */
export default function AppSettingsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_BREAKPOINT;

  useEffect(() => {
    loadCompaniesFonts();
  }, []);

  return (
    <RequireAdmin>
      <View style={accountStyles.screen}>
        <SiteHeader />

        <ScrollView contentContainerStyle={accountStyles.scroll}>
          <View
            style={[
              accountStyles.shell,
              {
                paddingHorizontal: pageHPadding(width),
                paddingTop: isWide ? 88 : 40,
                paddingBottom: isWide ? 88 : 48,
              },
            ]}
          >
            <View style={[accountStyles.page, { maxWidth: PROFILE_CONTENT_MAX_WIDTH }]}>
              <AccountHero
                eyebrow="Admin"
                title="App settings"
                subtitle="Changes here go live for everyone as soon as you make them."
                isWide={isWide}
              />

              <View style={{ marginTop: isWide ? 72 : 40 }}>
                <AccountSection
                  index="01"
                  title="Landing ring photos"
                  description={`The round photos orbiting in the header of the Companies page. Up to ${HERO_RING_MAX_IMAGES}, in the order they go round.`}
                  isWide={isWide}
                >
                  <HeroRingSettings isWide={isWide} />
                </AccountSection>
              </View>
            </View>
          </View>

          <SiteFooter />
        </ScrollView>
      </View>
    </RequireAdmin>
  );
}
