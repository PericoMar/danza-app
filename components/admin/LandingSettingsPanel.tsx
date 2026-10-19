import { AccountSection } from '@/components/account';
import HeroRingSettings from '@/components/admin/HeroRingSettings';
import { HERO_RING_MAX_IMAGES } from '@/constants/heroRing';

/** The "Landing" tab of /admin/settings: what visitors see first. */
export default function LandingSettingsPanel({ isWide }: { isWide: boolean }) {
  return (
    <AccountSection
      index="01"
      title="Landing ring photos"
      description={`The round photos orbiting in the header of the Companies page. Up to ${HERO_RING_MAX_IMAGES}, in the order they go round.`}
      isWide={isWide}
    >
      <HeroRingSettings isWide={isWide} />
    </AccountSection>
  );
}
