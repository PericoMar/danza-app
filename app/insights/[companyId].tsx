// app/insights/[companyId].tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCompany } from '@/hooks/useCompanies';
import { useReviewUsers } from '@/hooks/useUserProfile';
import { useRole } from '@/providers/RoleProvider';
import { useAuth } from '@/app/_layout';
import { supabase } from '@/services/supabase';
import { getActiveAuditionsByRelevance } from '@/utils/auditions';
import { SnackbarState } from '@/types/ui';
import { REVIEWS_ENABLED } from '@/constants/features';

import { Colors } from '@/theme/colors';
import { INTER, loadInsightsFonts, insightsColWidth, insightsHPadding } from '@/theme/insights';
import { loadLandingFonts } from '@/theme/landing';

import SiteHeader from '@/components/common/SiteHeader';
import SiteFooter from '@/components/common/SiteFooter';
import Snackbar from '@/components/Snackbar';
import SocialLinks from '@/components/ui/SocialLinks';
import FavoriteHeartButton from '@/components/ui/FavoriteHeartButton';
import ReviewCard from '@/components/ReviewCard';
import CompanyAuditionSection from '@/components/auditions/CompanyAuditionSection';

import CompanySkeleton from '@/components/insights/CompanySkeleton';
import CompanyStickyHeader from '@/components/insights/CompanyStickyHeader';
import CompanyDescription from '@/components/insights/CompanyDescription';
import CompanyAdminActions from '@/components/insights/CompanyAdminActions';
import InsightsSectionHeader from '@/components/insights/InsightsSectionHeader';
import AlreadyReviewedBanner from '@/components/insights/AlreadyReviewedBanner';

loadInsightsFonts();
loadLandingFonts();

const SNACKBAR_DURATION = 3000;
const SNACK_ERROR = { color: '#EF4444', iconName: 'alert-circle-outline' } as const;
const SNACK_SUCCESS = { color: '#22C55E', iconName: 'checkmark-circle-outline' } as const;

type ReviewRow = {
  id: string;
  user_id: string;
  created_at: string;
  [key: string]: any;
};

export default function CompanyInsightsScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { data: company, isLoading, error } = useCompany(companyId);

  const { width } = useWindowDimensions();
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const { isAdmin } = useRole();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && company) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isLoading, company, fadeAnim]);

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
      setSnackbar(
        deleteError
          ? { message: 'Failed to delete review', ...SNACK_ERROR }
          : { message: 'Review deleted', ...SNACK_SUCCESS },
      );
      if (!deleteError) await fetchReviews();
    },
    [fetchReviews],
  );

  const colWidth = insightsColWidth(width);
  const hPad = insightsHPadding(width);

  if (isLoading || loadingReviews) {
    return <CompanySkeleton />;
  }

  if (error || !company) {
    return (
      <View style={styles.container}>
        <SiteHeader />
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn’t load this company.</Text>
          <Text style={styles.errorBody}>Check your connection and try again.</Text>
        </View>
      </View>
    );
  }

  const activeAuditions = getActiveAuditionsByRelevance(company);

  return (
    <View style={styles.container}>
      <SiteHeader />

      <CompanyStickyHeader
        scrollY={scrollY}
        name={company.name}
        countryIsoCode={company.country_iso_code}
        onBack={() => (router.canGoBack() ? router.back() : router.push('/companies'))}
      />

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        <Animated.View
          style={[
            styles.col,
            { maxWidth: colWidth, paddingHorizontal: hPad, opacity: fadeAnim },
          ]}
        >
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.locationText}>{company.location ?? 'Location unknown'}</Text>
          </View>

          <CompanyDescription text={company.description} />

          <View style={styles.socialRow}>
            <SocialLinks
              website={company.website_url}
              instagram={company.instagram_url}
              facebook={company.meta_url}
            />
            {isLoggedIn && (
              <View style={styles.heart}>
                <FavoriteHeartButton
                  companyId={company.id}
                  initialIsFavorite={company.is_favorite ?? false}
                  size={17}
                  activeColor={Colors.pink}
                  inactiveColor={Colors.pink}
                  containerStyle={styles.heartHit}
                />
              </View>
            )}
          </View>

          <CompanyAuditionSection auditions={activeAuditions} companyName={company.name} />

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
                    showSnackbar={setSnackbar}
                  />
                ))}
              </View>
            </View>
          )}

          {REVIEWS_ENABLED && isLoggedIn && myReview && <AlreadyReviewedBanner />}
        </Animated.View>

        <SiteFooter />
      </Animated.ScrollView>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={SNACKBAR_DURATION}
          onClose={() => setSnackbar(null)}
        />
      )}
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.textMuted,
  },
  socialRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heart: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.chromeSoft,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
