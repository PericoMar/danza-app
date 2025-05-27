import { View, Text, StyleSheet, Image, Platform, Pressable, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Portal, Button as PaperButton } from 'react-native-paper'; // Renamed to avoid conflict
import { Review } from '@/hooks/useReviews';
import { User } from '@/hooks/useUserProfile';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

// Define User Session Interface
interface UserSession {
  user: {
    id: string;
    // Add other user properties if needed
  };
  // Add other session properties if needed
}

interface ReviewCardProps {
  review: Review;
  user?: User;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000); // en segundos

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
  if (diff < hour) return `${Math.floor(diff / minute)} minute${Math.floor(diff / minute) !== 1 ? 's' : ''} ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hour${Math.floor(diff / hour) !== 1 ? 's' : ''} ago`;
  if (diff < month) return `${Math.floor(diff / day)} day${Math.floor(diff / day) !== 1 ? 's' : ''} ago`;
  if (diff < year) return `${Math.floor(diff / month)} month${Math.floor(diff / month) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / year)} year${Math.floor(diff / year) !== 1 ? 's' : ''} ago`;
}

// Define the valid content keys explicitly
type ReviewContentKey = 'salary' | 'repertoire' | 'staff' | 'schedule' | 'facilities' | 'colleagues' | 'city';

const sections: { key: string; title: string }[] = [
  { key: 'salary', title: 'Salary & Compensation' },
  { key: 'repertoire', title: 'Repertoire, Operas, Touring & Roles' },
  { key: 'staff', title: 'Staff, Classes & Rehearsals' },
  { key: 'schedule', title: 'Schedule & Holidays' },
  { key: 'facilities', title: 'Facilities, Wellbeing & Injuries' },
  { key: 'colleagues', title: 'Colleagues & General Mood' },
  { key: 'city', title: 'City, Transport & Living' },
];

const MAX_CONTENT_LENGTH = 100; // Define max content length

export default function ReviewCard({ review, user }: ReviewCardProps) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // const [isExpanded, setIsExpanded] = useState(false); // Removed old state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [optionsButtonLayout, setOptionsButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDeleting, setIsDeleting] = useState(false);

  const windowWidth = Dimensions.get('window').width;

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  useEffect(() => {
    const fetchCurrentUserSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching user session:', error);
        return;
      }
      setCurrentUser(data.session as UserSession | null);
    };

    fetchCurrentUserSession();
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewId) {
      Alert.alert('Error', 'Cannot delete review without an ID.');
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) {
        console.error('Error deleting review:', error);
        Alert.alert('Error', 'Failed to delete review. ' + error.message);
      } else {
        Alert.alert('Success', 'Review deleted.');
        setIsModalVisible(false);
        // In a real app with react-query, query invalidation would happen here
        // e.g., queryClient.invalidateQueries(['reviews', review.company_id]);
      }
    } catch (e: any) {
      console.error('Exception deleting review:', e);
      Alert.alert('Error', 'An unexpected error occurred: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const contentRecord: Record<string, string> =
    typeof review.content === 'object' && review.content !== null
      ? review.content as Record<ReviewContentKey, string>
      : {} as Record<ReviewContentKey, string>;

  return (
    <View style={styles.card}>
      {/* Top Row: Avatar + Name + Time */}
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: review.visibility_type === 'anonymous'
                ? 'https://i.pravatar.cc/100?u=anonymous'
                : user?.profile_img || 'https://i.pravatar.cc/100?u=fallback',
            }}
            style={styles.avatar}
          />
          <View style={styles.nameWithTime}>
            <Text style={styles.username} numberOfLines={1}>
              {review.visibility_type === 'anonymous' ? 'Anonymous' : user?.name || 'Unknown'}
            </Text>
            <Text style={styles.timeAgo}>{timeAgo(review.created_at)}</Text>
          </View>
        </View>

        {currentUser && currentUser.user && currentUser.user.id === review.user_id && (
          <View
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setOptionsButtonLayout(layout);
            }}
          >
            <Pressable style={styles.optionsButton} onPress={() => setIsModalVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={18} color="#666" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Content by section */}
      {sections.map(({ key, title }) => {
        const content = contentRecord[key]?.trim();
        if (!content) {
          return null;
        }

        const isLongText = content.length > MAX_CONTENT_LENGTH;
        const isSectionExpanded = expandedSections[key];

        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>
              {isLongText && !isSectionExpanded
                ? `${content.substring(0, MAX_CONTENT_LENGTH)}...`
                : content}
            </Text>
            {isLongText && (
              <Pressable onPress={() => toggleSectionExpansion(key)} style={styles.seeMoreButton}>
                <Text style={styles.seeMoreButtonText}>
                  {isSectionExpanded ? 'See less' : 'See more'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {/* Rating */}
      <View style={styles.ratingContainer}>
        {Array.from({ length: 5 }).map((_, index) => {
          const fullStars = Math.floor(review.rating);
          const hasHalf = review.rating % 1 >= 0.5 && index === fullStars;

          return (
            <Ionicons
              key={index}
              name={
                index < fullStars
                  ? 'star'
                  : hasHalf
                  ? 'star-half-outline'
                  : 'star-outline'
              }
              size={16}
              color="#facc15"
            />
          );
        })}
      </View>

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            {
              top: optionsButtonLayout.y,
              right: windowWidth - optionsButtonLayout.x - optionsButtonLayout.width,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.modalButton, isDeleting ? styles.disabledButton : {}]}
            onPress={() => handleDeleteReview(review.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" style={styles.modalButtonIcon} />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={styles.modalButtonIcon} />
            )}
            <Text style={styles.modalButtonText}>
              {isDeleting ? 'Deleting...' : 'Eliminate'}
            </Text>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 4,
    marginLeft: 4
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  nameWithTime: {
    flexShrink: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    color: '#888',
  },
  optionsButton: {
    paddingHorizontal: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 150, // Adjust as needed
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalButtonIcon: {
    marginRight: 8,
  },
  modalButtonText: {
    color: '#EF4444',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  seeMoreButton: {
    marginTop: 4,
    alignSelf: 'flex-start', // To make the button only as wide as its content
  },
  seeMoreButtonText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
});