import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '@/hooks/useReviews';
import { User } from '@/hooks/useUserProfile';

interface ReviewCardProps {
  review: Review;
  user?: User;
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
          <Text style={styles.username} numberOfLines={1}>
            {review.anonymous ? 'Anonymous' : user?.name || 'Unknown'}
          </Text>
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
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
