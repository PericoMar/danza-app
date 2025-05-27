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

export default function ReviewCard({ review, user }: ReviewCardProps) {
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

        <Pressable style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={18} color="#666" />
        </Pressable>
      </View>

      {/* Content by section */}
      {sections.map(({ key, title }) =>
        contentRecord[key]?.trim() ? (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>{contentRecord[key]}</Text>
          </View>
        ) : null
      )}

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
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
});