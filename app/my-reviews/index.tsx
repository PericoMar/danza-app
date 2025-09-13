import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TextInput, FlatList, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useUserReviews } from '@/hooks/useUserReviews';
import ReviewCard from '@/components/ReviewCard';
import { LARGE_SCREEN_BREAKPOINT, SCREEN_SIDE_PADDING_RATIO } from '@/constants/layout';
import { User } from '../types/user';

export default function MyReviewsScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});

  const { width } = useWindowDimensions();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingUser(true);
      setUserError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error('Not authenticated');

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

  const userId = currentUser?.user_id || ''; // ✅ para evitar error de hooks condicionales
  const { data: reviews, isLoading: isLoadingReviews, error: reviewsError } = useUserReviews(userId);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!localReviews.length) return;

      const ids = [...new Set(localReviews.map(r => r.company_id))];
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', ids);

      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach(c => { map[c.id] = c.name; });
        setCompanies(map);
      }
    };

    fetchCompanies();
  }, [localReviews]);


  useEffect(() => {
    if (reviews) setLocalReviews(reviews);
  }, [reviews]);

  const handleDelete = (id: string) => {
    setLocalReviews(prev => prev.filter(r => r.id !== id));
  };

  const noopSnackbar = () => { };

  const filteredReviews = useMemo(() => {
    if (!localReviews) return [];
    return localReviews.filter(review => {
      const allContent = Object.values(review.content || {}).join(' ').toLowerCase();
      return allContent.includes(searchText.toLowerCase());
    });
  }, [localReviews, searchText]);

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
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                {companies[item.company_id] || 'Unknown Company'}
              </Text>
              <ReviewCard
                review={item}
                user={currentUser}
                onDelete={handleDelete}
                showSnackbar={noopSnackbar}
              />
            </View>
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.reviewsListContainer}
        />

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContentSmall: { padding: 20, alignItems: 'center' },
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
  userInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userDescription: { fontSize: 14, color: '#666', marginTop: 4 },
  filtersRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, height: '100%', color: '#000' },
  reviewsListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
