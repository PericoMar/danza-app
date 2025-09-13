// app/reviews/[companyId].tsx
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
  Animated,
  Platform,          // ⬅️  Nuevo: para animaciones
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompany } from '@/hooks/useCompanies';
import { useReviewUsers } from '@/hooks/useUserProfile';
import ReviewCard from '@/components/ReviewCard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import FilterButton from '@/components/FilterButton';
import NewReviewModal from '@/components/newReviewModal';
import { supabase } from '@/services/supabase';
import Snackbar from '@/components/Snackbar';
import { SCREEN_SIDE_PADDING_RATIO, LARGE_SCREEN_BREAKPOINT } from '@/constants/layout';
import { useAiSummary } from '@/hooks/useAiSummary';
import { aiUser } from '@/constants/aiUser';
import AIButton from '@/components/ui/AiButton';
import { parsePartialJson } from '../utils/parsePartialJson';
import InsufficientReviewsModal from '@/components/InsufficientReviewsModal';
import { MINIMUM_REVIEWS_FOR_SUMMARY } from '@/constants/summary';
import { FlagCdn } from '@/components/ui/FlagCdn';
import { useRouter } from 'expo-router';

// ️🎚  Ajustes para el “header” animado
const HEADER_MAX_HEIGHT = 60;
const HEADER_MIN_HEIGHT = 40;
const HEADER_MAX_FONT = 24;
const HEADER_MIN_FONT = 18;

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
  } | null>(null);

  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { data: company, isLoading, error } = useCompany(companyId);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInsufficientReviewsVisible, setModalInsufficientReviewsVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const { width } = useWindowDimensions();

  const router = useRouter();

  // Animación de scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  const headerFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [HEADER_MAX_FONT, HEADER_MIN_FONT],
    extrapolate: 'clamp',
  });

  // Hook de AI
  const { summary, isLoading: isGenerating, error: summaryError, generate } = useAiSummary();

  /* ======================== DATA ======================== */
  const fetchReviews = async () => {
    if (!companyId) return;
    setLoadingReviews(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (!error && data) setReviews(data);
    setLoadingReviews(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();
    fetchReviews();
  }, []);

  const userIds = reviews.map(r => r.user_id);
  const { data: users, isLoading: loadingUsers } = useReviewUsers(userIds);

  const myReview = useMemo(
    () => reviews.find(r => r.user_id === user?.id) ?? null,
    [reviews, user?.id],
  );

  const filteredReviews = [...reviews].sort((a, b) => {
    switch (selectedFilter) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  // Combinar AI summary como una review más
  const combinedReviews = useMemo(() => {
    if (isGenerating || summary) {
      console.log(summary)
      const aiReview = {
        id: 'ai-summary',
        user_id: 'ai-user',
        content: parsePartialJson(summary), // ⬅️ parcial mientras llega
        rating: 0,
        visibility_type: 'public',
        created_at: new Date().toISOString(),
        __version: summary.length,          // ⬅️ tick para memoizations
      };
      return [aiReview, ...filteredReviews];
    }
    return filteredReviews;
  }, [isGenerating, summary, filteredReviews]);


  /* =================== ACTIONS =================== */
  const handleGenerate = () => {
    if (reviews.length < MINIMUM_REVIEWS_FOR_SUMMARY) {
      setModalInsufficientReviewsVisible(true);
      return;
    }
    const lines = reviews
      .slice(0, 100)
      .map(r => `Rating ${r.rating}: ${Object.values(r.content).filter(Boolean).join(' ')}`);
    generate(lines);
  };

  const handleSubmitReview = async ({
    content,
    visibility_type,
    rating,
  }: {
    content: any;
    visibility_type: 'anonymous' | 'non-visible' | 'public';
    rating: number;
  }) => {
    if (!companyId || !user) return;

    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        company_id: companyId,
        user_id: user.id,
        content,
        rating,
        visibility_type,
      });

    if (insertError) {
      setSnackbar({ message: 'Error submitting review.', color: '#EF4444', iconName: 'close-circle-outline' });
      return;
    }

    const { data: companyData, error: compError } = await supabase
      .from('companies')
      .select('review_count, rating_count, average_rating')
      .eq('id', companyId)
      .single();

    if (compError || !companyData) {
      setSnackbar({
        message: 'Review added, but failed to fetch company stats.',
        color: '#F59E0B',
        iconName: 'alert-circle-outline',
      });
      return;
    }

    const now = new Date().toISOString();
    const newReviewCount = (companyData.review_count ?? 0) + 1;

    const updates: Record<string, any> = {
      review_count: newReviewCount,
      last_reviewed_at: now,
    };

    if (rating > 0) {
      const oldRatingCount = companyData.rating_count ?? 0;
      const oldAverage = companyData.average_rating ?? 0;
      const newRatingCount = oldRatingCount + 1;
      const newAverage = (oldAverage * oldRatingCount + rating) / newRatingCount;
      updates.rating_count = newRatingCount;
      updates.average_rating = newAverage;
    }

    const { error: updateError } = await supabase.from('companies').update(updates).eq('id', companyId);

    setSnackbar(
      updateError
        ? { message: 'Review added, but failed to update company stats.', color: '#F59E0B', iconName: 'alert-circle-outline' }
        : { message: 'Review submitted successfully!', color: '#22C55E', iconName: 'checkmark-circle-outline' },
    );

    await fetchReviews();
  };

  const handleDeleteReviewFromCard = async (reviewId: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    setSnackbar(
      error
        ? { message: 'Failed to delete review', color: '#EF4444', iconName: 'alert-circle-outline' }
        : { message: 'Review deleted', color: '#22C55E', iconName: 'checkmark-circle-outline' },
    );
    if (!error) await fetchReviews();
  };

  /* ======================= UI STATES ======================= */
  if (loadingReviews || loadingUsers) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error || !company) {
    return (
      <View style={styles.center}>
        <Text>Error loading company details</Text>
      </View>
    );
  }

  /* ======================= RENDER ======================= */
  return (
    <View
      style={[
        styles.container,
        width > LARGE_SCREEN_BREAKPOINT && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO },
      ]}
    >
      {/* ======= Snackbar ======= */}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3000}
          onClose={() => setSnackbar(null)}
        />
      )}

      {/* ======= Header fijo + animado ======= */}
      <Animated.View style={[styles.stickyHeader, { height: headerHeight }]}>
        <View style={styles.headerRow}>
          <Animated.Text
            style={[
              styles.companyName,
              { fontSize: headerFontSize, flex: 1, minWidth: 0 }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {company.name}
          </Animated.Text>

          {company.country_iso_code && (
            <FlagCdn iso={company.country_iso_code} size={20} style={{ marginLeft: 6 }} />
          )}
        </View>
      </Animated.View>


      {/* ======= Contenido scrollable ======= */}
      <Animated.FlatList
        data={combinedReviews}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        extraData={{ s: summary.length, g: isGenerating }}
        persistentScrollbar={false}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        stickyHeaderIndices={[]}      // No sticky aquí: solo el header superior
        style={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.location}>{company.location}</Text>
            </View>
            <Text style={styles.companyDescription}>{company.description}</Text>

            {/* Botón AI + error */}
            <AIButton isGenerating={isGenerating} onPress={handleGenerate} />
            {summaryError && <Text style={styles.aiError}>{summaryError}</Text>}

            <Pressable
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: '/companies/[companyId]/edit',
                  params: { companyId }, // <- type-safe
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Edit company"
            >
              <Ionicons name="pencil" size={16} color="#111" style={{ marginRight: 6 }} />
              <Text style={styles.editButtonText}>Edit company</Text>
            </Pressable>

            {/* Filtros */}
            <View style={styles.filtersContainer}>
              <FilterButton label="Newest" active={selectedFilter === 'newest'} onPress={() => setSelectedFilter('newest')} />
              <FilterButton label="Oldest" active={selectedFilter === 'oldest'} onPress={() => setSelectedFilter('oldest')} />
              <FilterButton label="Highest rating" active={selectedFilter === 'highest'} onPress={() => setSelectedFilter('highest')} />
              <FilterButton label="Lowest rating" active={selectedFilter === 'lowest'} onPress={() => setSelectedFilter('lowest')} />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const userItem = item.id === 'ai-summary' ? aiUser : users?.find(u => u.user_id === item.user_id);
          return (
            <ReviewCard
              review={item}
              user={userItem}
              onDelete={handleDeleteReviewFromCard}
              showSnackbar={setSnackbar}
            />
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        )}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 16, paddingBottom: 100 }}
      />

      {/* ======= Modales ======= */}
      <NewReviewModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={handleSubmitReview} />
      <InsufficientReviewsModal visible={modalInsufficientReviewsVisible} onClose={() => setModalInsufficientReviewsVisible(false)} />

      {/* ======= Botón de acción ======= */}
      {user && !myReview && (
        <Pressable
          style={[
            styles.floatingButton,
            width > LARGE_SCREEN_BREAKPOINT && { right: width * SCREEN_SIDE_PADDING_RATIO },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="create-outline" size={36} color="white" />
        </Pressable>
      )}

      {/* Si ya existe review, muestra un aviso */}
      {myReview && (
        <View style={styles.alreadyReviewedBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text style={styles.alreadyReviewedText}>
            You have already reviewed this company.
          </Text>
        </View>
      )}
    </View>
  );
}

/* ============================= STYLES ============================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  /* Header fijo (solo nombre) */
  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  headerRow: {
    // que el row use todo el ancho y gestione el padding
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  companyName: {
    fontWeight: 'bold',
    maxWidth: 850,
    overflow: 'hidden',
  },

  /* --- Resto --- */
  list: {
    paddingHorizontal: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  companyDescription: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 12,
  },
  aiError: { color: 'red', marginBottom: 12 },
  editButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffffff', // gris clarito
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: 'gray' },
  floatingButton: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 70,
    height: 70,
    borderRadius: 30,
    backgroundColor: '#3E92CC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  alreadyReviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    marginBottom: 12,
  },
  alreadyReviewedText: { marginLeft: 6, color: '#166534' },
});
