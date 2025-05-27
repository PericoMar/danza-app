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
import AiSummaryModal from '@/components/AiSummaryModal';
import { SCREEN_SIDE_PADDING_RATIO, LARGE_SCREEN_BREAKPOINT } from '@/constants/layout';
import Snackbar from '@/components/Snackbar';

export default function ReviewsScreen() {
  const [snackbar, setSnackbar] = useState<{
    message: string;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
  } | null>(null);

  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { data: company, isLoading, error } = useCompany(companyId);
  const { data: reviews, isLoading: loadingReviews } = useReviews(companyId);
  const userIds = reviews?.map(r => r.user_id) ?? [];
  const { data: users, isLoading: loadingUsers } = useReviewUsers(userIds);

  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const { width } = useWindowDimensions();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();
  }, []);

  const filteredReviews = [...(reviews || [])].sort((a, b) => {
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
      console.error('Error submitting review:', reviewError);
      setSnackbar({
        message: 'Error submitting review.',
        color: '#EF4444',
        iconName: 'close-circle-outline',
      });
      return;
    }

    // ✅ Actualizar el campo `last_reviewed_at` en `companies`
    const { error: updateError } = await supabase
      .from('companies')
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating last_reviewed_at:', updateError);
      setSnackbar({
        message: 'Review submitted, but failed to update company info.',
        color: '#F59E0B',
        iconName: 'alert-circle-outline',
      });
    } else {
      console.log('last_reviewed_at updated!');
      setSnackbar({
        message: 'Review submitted successfully!',
        color: '#22C55E',
        iconName: 'checkmark-circle-outline',
      });
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

      {/* Snackbar */}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3000}
          onClose={() => setSnackbar(null)}
        />
      )}

      {/* Header de la compañía */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{company.name}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{company.location}</Text>
        </View>
        <Text style={styles.companyDescription}>{company.description}</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FilterButton label="Newest" active={selectedFilter === 'newest'} onPress={() => setSelectedFilter('newest')} />
        <FilterButton label="Oldest" active={selectedFilter === 'oldest'} onPress={() => setSelectedFilter('oldest')} />
        <FilterButton label="Highest rating" active={selectedFilter === 'highest'} onPress={() => setSelectedFilter('highest')} />
        <FilterButton label="Lowest rating" active={selectedFilter === 'lowest'} onPress={() => setSelectedFilter('lowest')} />
      </View>

      {/* Lista de reviews */}
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const userItem = users?.find(u => u.user_id === item.user_id);

          return (
            <ReviewCard
              review={item}
              user={userItem}
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

      {/* Modal de nueva review */}
      <NewReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitReview}
      />

      {/* Botón flotante */}
      {user && (
        <>
          <Pressable
            style={[
              styles.floatingButton,
              width > LARGE_SCREEN_BREAKPOINT && {
                right: width * SCREEN_SIDE_PADDING_RATIO,
              },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="create-outline" size={36} color="white" />
          </Pressable>
        </>
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
