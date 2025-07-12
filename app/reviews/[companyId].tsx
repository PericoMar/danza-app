// app/reviews/[companyId].tsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompany } from '@/hooks/useCompanies';
import { useReviewUsers } from '@/hooks/useUserProfile';
import ReviewCard from '@/components/ReviewCard';
import React, { useEffect, useMemo, useState } from 'react';
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

  // Hook de AI
  const { summary, isLoading: isGenerating, error: summaryError, generate } = useAiSummary();

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

  // 3) Combinar AI summary como una review más
  const combinedReviews = useMemo(() => {
    if (!summary) return filteredReviews;

    const aiReview = {
      id: 'ai-summary',
      user_id: 'ai-user',
      content: parsePartialJson(summary),
      rating: 0,
      visibility_type: 'public',
      created_at: new Date().toISOString(),
    };

    console.log('AI Review:', aiReview);
    return [aiReview, ...filteredReviews];
  }, [summary, filteredReviews]);

  // 4) Generar summary al pulsar
  const handleGenerate = () => {
    if (reviews.length < MINIMUM_REVIEWS_FOR_SUMMARY) {
      // Si hay menos de 5 reviews, mostramos el modal y salimos
      setModalInsufficientReviewsVisible(true);
      return;
    }

    // Preparamos hasta 100 reviews como strings
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

    // 1) Insertar la nueva review
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
      setSnackbar({
        message: 'Error submitting review.',
        color: '#EF4444',
        iconName: 'close-circle-outline',
      });
      return;
    }

    // 2) Leer solo los contadores actuales de la compañía
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

    // 3) Preparar el objeto de actualización
    const now = new Date().toISOString();
    const newReviewCount = (companyData.review_count ?? 0) + 1;

    // Siempre actualizamos review_count y last_reviewed_at
    const updates: Record<string, any> = {
      review_count: newReviewCount,
      last_reviewed_at: now,
    };

    if (rating > 0) {
      const oldRatingCount = companyData.rating_count ?? 0;
      const oldAverage = companyData.average_rating ?? 0;
      const newRatingCount = oldRatingCount + 1;
      const newAverage =
        (oldAverage * oldRatingCount + rating) / newRatingCount;

      updates.rating_count = newRatingCount;
      updates.average_rating = newAverage;
    }

    // 4) Aplicar la actualización en un solo llamado
    const { error: updateError } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId);

    if (updateError) {
      setSnackbar({
        message: 'Review added, but failed to update company stats.',
        color: '#F59E0B',
        iconName: 'alert-circle-outline',
      });
    } else {
      setSnackbar({
        message: 'Review submitted successfully!',
        color: '#22C55E',
        iconName: 'checkmark-circle-outline',
      });
    }

    // 5) Refrescar las reviews si lo necesitas
    await fetchReviews();
  };


  const handleDeleteReviewFromCard = async (reviewId: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      setSnackbar({
        message: 'Failed to delete review',
        color: '#EF4444',
        iconName: 'alert-circle-outline',
      });
    } else {
      setSnackbar({
        message: 'Review deleted',
        color: '#22C55E',
        iconName: 'checkmark-circle-outline',
      });
      await fetchReviews();
    }
  };

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

  return (
    <View style={[styles.container, width > LARGE_SCREEN_BREAKPOINT && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO }]}>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3000}
          onClose={() => setSnackbar(null)}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.companyName}>{company.name}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{company.location}</Text>
        </View>
        <Text style={styles.companyDescription}>{company.description}</Text>
      </View>

      {/* Botón para generar el summary */}
      <AIButton isGenerating={isGenerating} onPress={handleGenerate} />
      {summaryError && <Text style={[styles.aiError]}>{summaryError}</Text>}

      <View style={styles.filtersContainer}>
        <FilterButton label="Newest" active={selectedFilter === 'newest'} onPress={() => setSelectedFilter('newest')} />
        <FilterButton label="Oldest" active={selectedFilter === 'oldest'} onPress={() => setSelectedFilter('oldest')} />
        <FilterButton label="Highest rating" active={selectedFilter === 'highest'} onPress={() => setSelectedFilter('highest')} />
        <FilterButton label="Lowest rating" active={selectedFilter === 'lowest'} onPress={() => setSelectedFilter('lowest')} />
      </View>

      <FlatList
        data={combinedReviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const userItem = item.id === 'ai-summary'
            ? aiUser
            : users?.find(u => u.user_id === item.user_id);

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
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <NewReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitReview}
      />

      <InsufficientReviewsModal
        visible={modalInsufficientReviewsVisible}
        onClose={() => setModalInsufficientReviewsVisible(false)}
      />

      {user && (
        <Pressable
          style={[styles.floatingButton, width > LARGE_SCREEN_BREAKPOINT && {
            right: width * SCREEN_SIDE_PADDING_RATIO,
          }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="create-outline" size={36} color="white" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E92CC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  aiButtonText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  aiError: { color: 'red', marginBottom: 12 },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
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
});
