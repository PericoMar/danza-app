import { useState } from 'react';
import { Text } from 'react-native';
import { AccountSection } from '@/components/account';
import type { SegmentedTab } from '@/components/common/SegmentedTabs';
import DesignPicker, { type DesignOption } from './DesignPicker';
import PreviewToolbar, { previewNoteStyles } from './PreviewToolbar';
import NewsletterPopupPreview from './NewsletterPopupPreview';
import NewsletterPopupThumbnail from './NewsletterPopupThumbnail';
import { NEWSLETTER_POPUP_CATALOG, NEWSLETTER_POPUP_PICKER_ORDER } from './newsletterPopupCatalog';
import {
  ACTIVE_NEWSLETTER_POPUP_DESIGN,
  type NewsletterPopupDesign,
} from '@/constants/newsletterPopup';

/** Who the preview pretends the visitor is. */
const PreviewAudience = {
  GUEST: 'guest',
  MEMBER: 'member',
} as const;

type PreviewAudience = (typeof PreviewAudience)[keyof typeof PreviewAudience];

const AUDIENCE_TABS: SegmentedTab<PreviewAudience>[] = [
  { key: PreviewAudience.GUEST, label: 'Guest', icon: 'person-outline' },
  { key: PreviewAudience.MEMBER, label: 'Signed in', icon: 'person-circle-outline' },
];

const DESIGN_OPTIONS: DesignOption<NewsletterPopupDesign>[] = NEWSLETTER_POPUP_PICKER_ORDER.map((design) => {
  const entry = NEWSLETTER_POPUP_CATALOG[design];
  return {
    key: design,
    name: entry.name,
    pitch: entry.pitch,
    thumbnail: (
      <NewsletterPopupThumbnail
        placement={entry.placement}
        surface={entry.surface}
        blocksPage={entry.blocksPage}
      />
    ),
    tag: entry.blocksPage
      ? { label: 'Blocks the page', icon: 'contract-outline' }
      : { label: 'Page stays usable', icon: 'hand-left-outline' },
  };
});

/** The "Newsletter popup" tab of /admin/settings: try every popup design in place. */
export default function NewsletterPopupSettingsPanel({ isWide }: { isWide: boolean }) {
  const [audience, setAudience] = useState<PreviewAudience>(PreviewAudience.GUEST);
  const [openDesign, setOpenDesign] = useState<NewsletterPopupDesign | null>(null);
  const liveName = NEWSLETTER_POPUP_CATALOG[ACTIVE_NEWSLETTER_POPUP_DESIGN].name;

  return (
    <>
      <AccountSection
        index="01"
        title="Popup design"
        description={`${NEWSLETTER_POPUP_PICKER_ORDER.length} takes on the audition-alerts popup. Open any of them over this page: the form works, but a preview never subscribes anyone.`}
        isWide={isWide}
      >
        <PreviewToolbar
          label="Preview as"
          tabs={AUDIENCE_TABS}
          value={audience}
          onChange={setAudience}
          accessibilityLabel="Preview the popup as"
        />

        <DesignPicker
          options={DESIGN_OPTIONS}
          liveKey={ACTIVE_NEWSLETTER_POPUP_DESIGN}
          openKey={openDesign}
          onPreview={setOpenDesign}
        />

        <Text style={previewNoteStyles.note}>
          Visitors get <Text style={previewNoteStyles.strong}>{liveName}</Text> today. Guests see an email
          field; signed-in members subscribe the address on their account.
        </Text>
      </AccountSection>

      {openDesign && (
        <NewsletterPopupPreview
          // A fresh form for every design and audience, as a visitor would get.
          key={`${openDesign}-${audience}`}
          design={openDesign}
          isGuest={audience === PreviewAudience.GUEST}
          onClose={() => setOpenDesign(null)}
        />
      )}
    </>
  );
}

