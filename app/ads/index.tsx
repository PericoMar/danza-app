import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/providers/RoleProvider';
import { getAds, deleteAd } from '@/services/ads';
import type { Ad } from '@/types/ads';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export default function AdsScreen() {
  const { isAdmin } = useRole();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAds();
      setAds(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load ads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(fetchAds);

  const handleDelete = async (ad: Ad) => {
    setDeletingId(ad.id);
    try {
      await deleteAd(ad.id, ad.image_url);
      setAds(prev => prev.filter(a => a.id !== ad.id));
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete ad.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Ads</Text>
        {isAdmin && (
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/ads/add')}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>New Ad</Text>
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : ads.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="megaphone-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No ads yet.</Text>
          {isAdmin && (
            <Pressable
              style={[styles.addButton, { marginTop: 16 }]}
              onPress={() => router.push('/ads/add')}
            >
              <Text style={styles.addButtonText}>Create your first ad</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={[styles.grid, isWide && styles.gridWide]}>
          {ads.map(ad => (
            <View key={ad.id} style={[styles.card, isWide && styles.cardWide]}>
              <Image
                source={{ uri: ad.image_url }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>
                    {ad.title}
                  </Text>
                  {!ad.published && (
                    <View style={styles.draftBadge}>
                      <Text style={styles.draftBadgeText}>DRAFT</Text>
                    </View>
                  )}
                </View>
                {ad.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {ad.description}
                  </Text>
                )}
                <Text style={styles.cardDates}>
                  {formatDate(ad.active_from)} → {formatDate(ad.active_until)}
                </Text>
              </View>

              {isAdmin && (
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => router.push(`/ads/${ad.id}/edit`)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="pencil-outline" size={16} color="#555" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDelete(ad)}
                    disabled={deletingId === ad.id}
                    accessibilityRole="button"
                  >
                    {deletingId === ad.id ? (
                      <ActivityIndicator size="small" color="#d32f2f" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={16} color="#d32f2f" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  content: {
    padding: 22,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#23272f',
    letterSpacing: -1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: '#d32f2f',
    fontWeight: '600',
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
  },
  grid: {
    gap: 14,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ececec',
    shadowColor: '#aaa',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardWide: {
    width: '31%',
    minWidth: 240,
    flexGrow: 1,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#23272f',
  },
  draftBadge: {
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#f5c542',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  draftBadgeText: {
    color: '#a07800',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cardDates: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  editButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500',
  },
});
