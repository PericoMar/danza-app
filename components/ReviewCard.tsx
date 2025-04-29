import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '@/hooks/useReviews';
import { User } from '@/hooks/useUserProfile';

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

export default function ReviewCard({ review, user }: ReviewCardProps) {
  return (
    <View style={styles.card}>
      {/* Top Row: Avatar + Name + 3 dots */}
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: review.anonymous
                ? 'https://i.pravatar.cc/100?u=anonymous'
                : user?.profile_img || 'https://i.pravatar.cc/100?u=fallback',
            }}
            style={styles.avatar}
          />
          <View style={styles.nameWithTime}>
            <Text style={styles.username} numberOfLines={1}>
              {review.anonymous ? 'Anonymous' : user?.name || 'Unknown'}
            </Text>
            <Text style={styles.timeAgo}>{timeAgo(review.created_at)}</Text>
          </View>
        </View>

        <Pressable style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={18} color="#666" />
        </Pressable>
      </View>

      {/* Content of the review */}
      <Text style={styles.content}>
        {review.content}
      </Text>

      {/* Rating */}
      <View style={styles.ratingContainer}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Ionicons
            key={index}
            name={index < review.rating ? 'star' : 'star-outline'}
            size={16}
            color="#facc15"
          />
        ))}
      </View>
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  content: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
