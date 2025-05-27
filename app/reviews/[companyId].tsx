// app/reviews/[companyId].tsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompany } from '@/hooks/useCompanies';
import { useReviews } from '@/hooks/useReviews';
import { useReviewUsers } from '@/hooks/useUserProfile';
import ReviewCard from '@/components/ReviewCard';
import React, { useEffect, useState } from 'react';
import FilterButton from '@/components/FilterButton';
import NewReviewModal from '@/components/newReviewModal';
import { supabase } from '@/services/supabase';
import Snackbar from '@/components/Snackbar';
import { SCREEN_SIDE_PADDING_RATIO, LARGE_SCREEN_BREAKPOINT } from '@/constants/layout';

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
  const [selectedFilter, setSelectedFilter] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const { width } = useWindowDimensions();

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

    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        company_id: companyId,
        user_id: user.id,
        content,
        rating,
        visibility_type,
      });

    if (reviewError) {
      setSnackbar({
        message: 'Error submitting review.',
        color: '#EF4444',
        iconName: 'close-circle-outline',
      });
      return;
    }

    const { data: allReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('company_id', companyId);

    if (fetchError || !allReviews) {
      setSnackbar({
        message: 'Review added, but failed to update company stats.',
        color: '#F59E0B',
        iconName: 'alert-circle-outline',
      });
      return;
    }

    const ratingValues = allReviews.map(r => r.rating).filter(r => typeof r === 'number');
    const ratingCount = ratingValues.length;
    const reviewCount = allReviews.length;
    const averageRating = ratingCount > 0 ? (ratingValues.reduce((sum, r) => sum + r, 0) / ratingCount) : 0;

    const { error: updateError } = await supabase
      .from('companies')
      .update({
        last_reviewed_at: new Date().toISOString(),
        review_count: reviewCount,
        rating_count: ratingCount,
        average_rating: averageRating,
      })
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

      <View style={styles.filtersContainer}>
        <FilterButton label="Newest" active={selectedFilter === 'newest'} onPress={() => setSelectedFilter('newest')} />
        <FilterButton label="Oldest" active={selectedFilter === 'oldest'} onPress={() => setSelectedFilter('oldest')} />
        <FilterButton label="Highest rating" active={selectedFilter === 'highest'} onPress={() => setSelectedFilter('highest')} />
        <FilterButton label="Lowest rating" active={selectedFilter === 'lowest'} onPress={() => setSelectedFilter('lowest')} />
      </View>

      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const userItem = users?.find(u => u.user_id === item.user_id);

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
