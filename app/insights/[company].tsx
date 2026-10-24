// app/insights/[company].tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useCompany } from '@/hooks/useCompanies';
import { useReviewUsers } from '@/hooks/useUserProfile';
import { useRole } from '@/providers/RoleProvider';
import { useAuth } from '@/app/_layout';
import { supabase } from '@/services/supabase';
import { getActiveAuditionsByRelevance } from '@/utils/auditions';
import { REVIEWS_ENABLED } from '@/constants/features';
import { MIN_TOUCH_TARGET, MOBILE_BREAKPOINT } from '@/constants/layout';
import { COMPANIES_ROUTE, companyPath } from '@/constants/routes';
import { SEO_COMPANIES } from '@/constants/generated/companies';
import { isUuid } from '@/utils/slug';

import { Colors } from '@/theme/colors';
import { INTER, loadInsightsFonts, insightsColWidth, insightsHPadding } from '@/theme/insights';
import { loadLandingFonts } from '@/theme/landing';

import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import SocialLinks from '@/components/ui/SocialLinks';
import FavoriteHeartButton from '@/components/ui/FavoriteHeartButton';
import ReviewCard from '@/components/ReviewCard';
import CompanyAuditionSection from '@/components/auditions/CompanyAuditionSection';
import EventParticipationBanner from '@/components/companies/EventParticipationBanner';

import CompanySeo from '@/components/insights/CompanySeo';
import CompanySkeleton from '@/components/insights/CompanySkeleton';
import CompanyHeading from '@/components/insights/CompanyHeading';
import BackLink from '@/components/ui/BackLink';
import CompanyDescription from '@/components/insights/CompanyDescription';
import CompanyAdminActions from '@/components/insights/CompanyAdminActions';
import InsightsSectionHeader from '@/components/insights/InsightsSectionHeader';
import InsightsSectionTitle from '@/components/insights/InsightsSectionTitle';
import AlreadyReviewedBanner from '@/components/insights/AlreadyReviewedBanner';
import { ToastTone } from '@/constants/toast';
import { useToast } from '@/providers/ToastProvider';

loadInsightsFonts();
loadLandingFonts();


type ReviewRow = {
  id: string;
  user_id: string;
  created_at: string;
  [key: string]: any;
};

/**
 * One prerendered HTML file per company, instead of a single shell for every id.
 * Server-only: expo-router calls this during the export, and it is what lets
 * <RouteSeo/> put a company's own title and structured data in its page.
 *
 * Companies created after the last deploy have no file and fall back to the
 * rewrite in vercel.json; they still work, just with generic copy until the
 * next build.
 */
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return SEO_COMPANIES.map((company) => ({ company: company.slug }));
}

export default function CompanyInsightsScreen() {
  // Either a slug or, from a link shared before slugs existed, a uuid.
  const { company: companyParam } = useLocalSearchParams<{ company: string }>();
  const { data: company, isLoading, error } = useCompany(companyParam);

  const { width } = useWindowDimensions();
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const { isAdmin } = useRole();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && company) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isLoading, company, fadeAnim]);

  // The company's id, not the URL segment: that can be a slug, and reviews are
  // keyed by the uuid. Waits for the company to load before asking.
  const companyId = company?.id;

  const fetchReviews = useCallback(async () => {
    if (!companyId || !REVIEWS_ENABLED) {
      setLoadingReviews(false);
      return;
    }
    setLoadingReviews(true);
    const { data, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (!fetchError && data) setReviews(data as ReviewRow[]);
    setLoadingReviews(false);
  }, [companyId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id ?? null));
    fetchReviews();
  }, [fetchReviews]);

  const userIds = useMemo(() => reviews.map((r) => r.user_id), [reviews]);
  const { data: reviewUsers } = useReviewUsers(userIds);

  const sortedReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [reviews],
  );
  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === currentUserId) ?? null,
    [reviews, currentUserId],
  );

  const handleDeleteReview = useCallback(
    async (reviewId: string) => {
      const { error: deleteError } = await supabase.from('reviews').delete().eq('id', reviewId);
      showToast(
        deleteError
          ? { message: 'Failed to delete review', tone: ToastTone.ERROR }
          : { message: 'Review deleted', tone: ToastTone.SUCCESS },
      );
      if (!deleteError) await fetchReviews();
    },
    [fetchReviews, showToast],
  );

  // A uuid still resolves, but it is not where this page lives. Send the
  // reader (and anything following them) to the address that is.
  useEffect(() => {
    if (!company?.slug) return;
    if (!companyParam || !isUuid(companyParam)) return;
    router.replace(companyPath(company.slug));
  }, [company?.slug, companyParam, router]);

  const colWidth = insightsColWidth(width);
  const hPad = insightsHPadding(width);
  // Phones get a back link pinned under the site header and the events as a plain line.
  const isPhone = width < MOBILE_BREAKPOINT;

  // Rendered on every branch: the prerendered HTML of this route is always the
  // loading one, and it still has to describe the page to a crawler.
  const seo = <CompanySeo company={company} />;

  if (isLoading || loadingReviews) {
    return (
      <>
        {seo}
        <CompanySkeleton />
      </>
    );
  }

  if (error || !company) {
    return (
      <View style={styles.container}>
        {seo}
        <SiteHeader />
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn’t load this company.</Text>
          <Text style={styles.errorBody}>Check your connection and try again.</Text>
        </View>
      </View>
    );
  }

  const activeAuditions = getActiveAuditionsByRelevance(company);
  const hasAuditions = activeAuditions.length > 0;
  const hasEventBanner = company.participating_in_events.length > 0;

  return (
    <View style={styles.container}>
      {seo}
      <SiteHeader />

      {isPhone && (
        <View style={styles.backBar}>
          <View style={[styles.backBarInner, { maxWidth: colWidth, paddingHorizontal: hPad }]}>
            <BackLink
              fallbackHref={COMPANIES_ROUTE}
              label="All companies"
              accessibilityLabel="Back to all companies"
              style={styles.backLink}
            />
          </View>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.col,
            isPhone && styles.colBelowBackBar,
            { maxWidth: colWidth, paddingHorizontal: hPad, opacity: fadeAnim },
          ]}
        >
          <CompanyHeading
            name={company.name}
            imageUrl={company.image}
            country={company.country}
            countryIsoCode={company.country_iso_code}
            location={company.location}
            style={styles.heading}
          />

          <CompanyDescription text={company.description} defaultExpanded={!hasAuditions} />

          <View style={styles.socialRow}>
            <SocialLinks
              website={company.website_url}
              instagram={company.instagram_url}
              facebook={company.meta_url}
            />
            {isLoggedIn && (
              <FavoriteHeartButton
                companyId={company.id}
                initialIsFavorite={company.is_favorite ?? false}
                size={20}
                activeColor={Colors.pink}
                inactiveColor={Colors.pink}
                containerStyle={styles.heartHit}
              />
            )}
          </View>

          {(hasAuditions || hasEventBanner) && (
            <View style={[styles.auditionsHeader, !isPhone && styles.auditionsHeaderRow]}>
              {hasAuditions && (
                <InsightsSectionTitle style={styles.auditionsTitle}>Auditions</InsightsSectionTitle>
              )}
              <EventParticipationBanner
                events={company.participating_in_events}
                variant={isPhone ? 'line' : 'box'}
                onEventPress={(eventId) => router.push(companyPath(eventId))}
                style={!isPhone && styles.eventBanner}
              />
            </View>
          )}

          <CompanyAuditionSection
            auditions={activeAuditions}
            companyName={company.name}
            style={hasEventBanner ? styles.auditionsBelowBanner : styles.belowAuditionsTitle}
          />

          {isAdmin && <CompanyAdminActions companyId={company.id} />}

          {REVIEWS_ENABLED && sortedReviews.length > 0 && (
            <View style={styles.insights}>
              <InsightsSectionHeader />
              <View style={styles.reviews}>
                {sortedReviews.map((item) => (
                  <ReviewCard
                    key={item.id}
                    review={item as any}
                    user={reviewUsers?.find((u) => u.user_id === item.user_id)}
                    onDelete={handleDeleteReview}
                  />
                ))}
              </View>
            </View>
          )}

          {REVIEWS_ENABLED && isLoggedIn && myReview && <AlreadyReviewedBanner />}
        </Animated.View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  col: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: 34,
    paddingBottom: 80,
  },
  backBar: {
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    zIndex: 40,
  },
  backBarInner: {
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    minHeight: MIN_TOUCH_TARGET,
  },
  colBelowBackBar: {
    paddingTop: 22,
  },
  heading: {
    marginBottom: 12,
  },
  // Phones stack the title over the events line; wider screens put the
  // banner beside the title and wrap it below when the names don't fit.
  auditionsHeader: {
    marginTop: 46,
    gap: 10,
  },
  auditionsHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 20,
    rowGap: 12,
  },
  eventBanner: {
    flexShrink: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.pinkBorder,
  },
  // Clears the state pill, which rises half its height above the card.
  auditionsBelowBanner: {
    marginTop: 32,
  },
  auditionsTitle: {
    textTransform: 'none',
  },
  // Whatever comes right after the "Auditions" title: the banner, or the auditions themselves.
  belowAuditionsTitle: {
    marginTop: 20,
  },
  socialRow: {
    marginTop: 26,
    // Pulls the 40px hit area left so the first glyph lines up with the text column.
    marginLeft: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heartHit: {
    width: 40,
    height: 40,
  },
  insights: {
    marginTop: 56,
    borderTopWidth: 1,
    borderTopColor: Colors.silver,
    paddingTop: 34,
  },
  reviews: {
    marginTop: 26,
    gap: 18,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  errorTitle: {
    fontFamily: INTER,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.text,
  },
  errorBody: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
