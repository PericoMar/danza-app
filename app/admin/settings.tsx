import { useEffect, type ComponentType } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RequireAdmin from '@/components/common/RequireAdmin';
import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import SegmentedTabs, { type SegmentedTab } from '@/components/common/SegmentedTabs';
import { AccountHero, accountStyles } from '@/components/account';
import UserStatsPanel from '@/components/admin/UserStatsPanel';
import LandingSettingsPanel from '@/components/admin/LandingSettingsPanel';
import NewsletterPopupSettingsPanel from '@/components/admin/NewsletterPopupSettingsPanel';
import AppearanceSettingsPanel from '@/components/admin/AppearanceSettingsPanel';
import { loadCompaniesFonts, pageHPadding } from '@/theme/companies';
import { PROFILE_CONTENT_MAX_WIDTH, TABLET_BREAKPOINT } from '@/constants/layout';
import {
  ADMIN_SETTINGS_TAB_PARAM,
  ADMIN_SETTINGS_TABS,
  AdminSettingsTab,
  toAdminSettingsTab,
} from '@/constants/adminSettings';

type TabContent = Omit<SegmentedTab<AdminSettingsTab>, 'key'> & {
  /** Shown under the page title while the tab is open. */
  subtitle: string;
  Panel: ComponentType<{ isWide: boolean }>;
};

const TAB_CONTENT: Record<AdminSettingsTab, TabContent> = {
  [AdminSettingsTab.USERS]: {
    label: 'User stats',
    icon: 'stats-chart-outline',
    subtitle: 'Who has signed up, and how fast that is growing.',
    Panel: UserStatsPanel,
  },
  [AdminSettingsTab.LANDING]: {
    label: 'Landing',
    icon: 'images-outline',
    subtitle: 'Changes here go live for everyone as soon as you make them.',
    Panel: LandingSettingsPanel,
  },
  [AdminSettingsTab.NEWSLETTER_POPUP]: {
    label: 'Newsletter popup',
    icon: 'notifications-outline',
    subtitle: 'Try every design for the audition-alerts popup. Previews never subscribe anyone.',
    Panel: NewsletterPopupSettingsPanel,
  },
  [AdminSettingsTab.APPEARANCE]: {
    label: 'Appearance',
    icon: 'color-palette-outline',
    subtitle: 'Try another look on this browser. Nobody else sees it.',
    Panel: AppearanceSettingsPanel,
  },
};

const TABS: SegmentedTab<AdminSettingsTab>[] = ADMIN_SETTINGS_TABS.map((key) => ({
  key,
  label: TAB_CONTENT[key].label,
  icon: TAB_CONTENT[key].icon,
}));

/** Admin-only tools, one tab each. Each tab is a stack of numbered sections. */
export default function AppSettingsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_BREAKPOINT;
  const router = useRouter();
  const params = useLocalSearchParams();
  const activeTab = toAdminSettingsTab(params[ADMIN_SETTINGS_TAB_PARAM]);
  const { subtitle, Panel } = TAB_CONTENT[activeTab];

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
              <AccountHero eyebrow="Admin" title="App settings" subtitle={subtitle} isWide={isWide} />

              {/* Under the hero, not beside it: beside it, every new tab squeezed the title. */}
              <View style={{ marginTop: isWide ? 40 : 28 }}>
                <SegmentedTabs
                  tabs={TABS}
                  value={activeTab}
                  onChange={(tab) => router.setParams({ [ADMIN_SETTINGS_TAB_PARAM]: tab })}
                  accessibilityLabel="Settings sections"
                />
              </View>

              <View style={{ marginTop: isWide ? 56 : 32 }}>
                <Panel isWide={isWide} />
              </View>
            </View>
          </View>

          <SiteFooter />
        </ScrollView>
      </View>
    </RequireAdmin>
  );
}
