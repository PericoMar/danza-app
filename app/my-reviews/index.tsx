import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TextInput, FlatList, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { User } from '@/hooks/useUserProfile';
import { useUserReviews } from '@/hooks/useUserReviews'; // Import the new hook
import ReviewCard from '@/components/ReviewCard'; // Import ReviewCard
import { LARGE_SCREEN_BREAKPOINT, SCREEN_SIDE_PADDING_RATIO } from '@/constants/layout';

export default function MyReviewsScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  
  const { width } = useWindowDimensions();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingUser(true);
      setUserError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) {
          throw new Error('Not authenticated');
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        if (profileError) throw profileError;
        if (!userProfile) throw new Error('User profile not found.');
        setCurrentUser(userProfile as User);
      } catch (e: any) {
        setUserError(e.message);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserProfile();
  }, []);

  const { data: reviews, isLoading: isLoadingReviews, error: reviewsError } = useUserReviews(currentUser?.user_id);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(review =>
      review.content.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [reviews, searchText]);

  if (isLoadingUser) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0000ff" /></View>;
  }

  if (userError) {
    return <View style={styles.center}><Text>Error loading profile: {userError}</Text></View>;
  }

  if (!currentUser) {
    return <View style={styles.center}><Text>No user profile found.</Text></View>;
  }

  return (
    <View style={[styles.container, width > LARGE_SCREEN_BREAKPOINT && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO }]}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: currentUser.profile_img || 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userDescription}>{currentUser.bio || 'No description available.'}</Text>
        </View>
      </View>

      {/* Filters Section */}
      <View style={styles.filtersRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search in your reviews..."
            placeholderTextColor="gray"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        {/* Add other filters here if needed, e.g., DropDownPicker for companies */}
      </View>

      {/* Reviews List Section */}
      {isLoadingReviews && (
        <View style={styles.centerContentSmall}><ActivityIndicator size="large" color="#0000ff" /></View>
      )}
      {reviewsError && (
        <View style={styles.centerContentSmall}><Text>Error loading reviews: {reviewsError.message}</Text></View>
      )}
      {!isLoadingReviews && !reviewsError && filteredReviews.length === 0 && (
        <View style={styles.centerContentSmall}><Text>No reviews found.</Text></View>
      )}
      {!isLoadingReviews && !reviewsError && filteredReviews.length > 0 && (
        <FlatList
          data={filteredReviews}
          renderItem={({ item }) => <ReviewCard review={item} user={currentUser} />}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.reviewsListContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContentSmall: { // For loading/error/no data messages within parts of the screen
    padding: 20,
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filtersRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff', // Changed from f0f0f0 to white for better contrast if filtersRow is light gray
    paddingHorizontal: 12,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#000', // Ensure text input color is visible
  },
  reviewsListContainer: { // Added for FlatList content
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
