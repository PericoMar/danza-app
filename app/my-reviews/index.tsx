import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  FlatList,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserReviews } from '@/hooks/useUserReviews';
import ReviewCard from '@/components/ReviewCard';
import { LARGE_SCREEN_BREAKPOINT, SCREEN_SIDE_PADDING_RATIO } from '@/constants/layout';
import { User } from '../types/user';
import { supabase } from '@/services/supabase';

function safeParseJson(input: unknown): Record<string, any> {
  if (!input) return {};
  if (typeof input === 'object' && !Array.isArray(input)) return input as Record<string, any>;
  if (typeof input === 'string') {
    try {
      const obj = JSON.parse(input);
      return obj && typeof obj === 'object' ? obj : {};
    } catch {
      return {};
    }
  }
  return {};
}

export default function MyReviewsScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});

  // 👇 Estados nuevos para edición del nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { width } = useWindowDimensions();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingUser(true);
      setUserError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error('Not authenticated');

        // 1) Intentar cargar perfil desde la tabla
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(); // no lanza error si no hay filas

        if (profileError) throw profileError;

        // 2) Si no hay fila, montar un perfil mínimo desde session.user
        const minimalProfile: User = {
          user_id: session.user.id,
          name:
            (session.user.user_metadata &&
              (session.user.user_metadata.full_name || session.user.user_metadata.name)) ||
            session.user.email?.split('@')[0] ||
            'User',
          bio: '',
          profile_img:
            (session.user.user_metadata &&
              (session.user.user_metadata.avatar_url || session.user.user_metadata.picture)) ||
            '',
        } as User;

        const profile = (userProfile as User) ?? minimalProfile;
        setCurrentUser(profile);
        setDraftName(profile.name || 'User'); // precargar borrador
      } catch (e: any) {
        setUserError(e.message ?? 'Unknown error');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserProfile();
  }, []);

  const userId = currentUser?.user_id || '';
  const { data: reviews, isLoading: isLoadingReviews, error: reviewsError } = useUserReviews(userId);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!localReviews.length) return;

      const ids = [...new Set(localReviews.map(r => r.company_id).filter(Boolean))];
      if (!ids.length) return;

      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', ids);

      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((c: any) => {
          map[c.id] = c.name;
        });
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

  const noopSnackbar = () => {};

  const filteredReviews = useMemo(() => {
    if (!localReviews?.length) return [];
    const q = (searchText || '').toLowerCase().trim();
    if (!q) return localReviews;

    return localReviews.filter(review => {
      const contentObj = safeParseJson(review?.content);
      const allContent = Object.values(contentObj).join(' ').toLowerCase();
      return allContent.includes(q);
    });
  }, [localReviews, searchText]);

  // 👇 Guardar nombre en Supabase
  const handleSaveName = async () => {
    if (!currentUser) return;
    const trimmed = draftName.trim();

    // Si no cambia nada o está vacío, salimos
    if (!trimmed || trimmed === currentUser.name) {
      setIsEditingName(false);
      setSaveError(null);
      setDraftName(currentUser.name || 'User');
      return;
    }

    try {
      setIsSavingName(true);
      setSaveError(null);

      const { error } = await supabase
        .from('users')
        .update({ name: trimmed })
        .eq('user_id', currentUser.user_id);

      if (error) throw error;

      // (Opcional) sincronizar metadata del auth:
      // await supabase.auth.updateUser({ data: { full_name: trimmed } });

      setCurrentUser(prev => (prev ? { ...prev, name: trimmed } as User : prev));
      setIsEditingName(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(currentUser?.name || 'User');
    setSaveError(null);
    setIsEditingName(false);
  };

  if (isLoadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (userError) {
    return (
      <View style={styles.center}>
        <Text>Error loading profile: {userError}</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <Text>No user profile found.</Text>
      </View>
    );
  }

  const displayName = currentUser.name || 'User';
  const displayBio = currentUser.bio || '';
  const displayImg =
    currentUser.profile_img || 'https://api.dicebear.com/6.x/bottts/svg?seed=panda';

  return (
    <View
      style={[
        styles.container,
        width > LARGE_SCREEN_BREAKPOINT && { paddingHorizontal: width * SCREEN_SIDE_PADDING_RATIO },
      ]}
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: displayImg }} style={styles.profileImage} />
        <View style={styles.userInfo}>
          {/* Nombre editable */}
          {!isEditingName ? (
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Pressable
                onPress={() => setIsEditingName(true)}
                accessibilityRole="button"
                accessibilityLabel="Edit name"
                hitSlop={8}
                style={styles.iconBtn}
              >
                <Ionicons name="pencil" size={18} color="#444" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.editRow}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                autoFocus
                editable={!isSavingName}
                selectTextOnFocus
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleSaveName}
                  disabled={isSavingName}
                  style={[styles.actionBtn, isSavingName && { opacity: 0.6 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Save"
                  hitSlop={8}
                >
                  <Ionicons name="checkmark" size={18} color="#0a7" />
                  <Text style={styles.actionText}>Save</Text>
                </Pressable>

                <Pressable
                  onPress={handleCancelEdit}
                  disabled={isSavingName}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color="#a00" />
                  <Text style={styles.actionText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}

          <Text style={styles.userDescription}>{displayBio}</Text>
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
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Reviews List Section */}
      {isLoadingReviews && (
        <View style={styles.centerContentSmall}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      {reviewsError && (
        <View style={styles.centerContentSmall}>
          <Text>Error loading reviews: {reviewsError.message}</Text>
        </View>
      )}
      {!isLoadingReviews && !reviewsError && filteredReviews.length === 0 && (
        <View style={styles.centerContentSmall}>
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 16 }}>
            You haven't written any reviews yet. Share your experience with a company to help others!
          </Text>
        </View>
      )}
      {!isLoadingReviews && !reviewsError && filteredReviews.length > 0 && (
        <FlatList
          data={filteredReviews}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, marginTop: 10 }}>
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
          keyExtractor={item => String(item.id)}
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
  // 👇 Nuevos/ajustados
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  editRow: {
    rowGap: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    color: '#111',
    backgroundColor: '#fff',
  },
  actionsRow: {
    flexDirection: 'row',
    columnGap: 12,
    marginTop: 4,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f7f7f7',
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  errorText: { color: '#b00020', marginTop: 4 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333', flexShrink: 1 },
  userDescription: { fontSize: 14, color: '#666', marginTop: 4 },

  // Filters / search
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
