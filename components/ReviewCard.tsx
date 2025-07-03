import { View, Text, StyleSheet, Image, Platform, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '@/hooks/useReviews';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import ReviewMenuOptions from './ReviewMenuOptions';
import { findNodeHandle } from 'react-native';
import { User } from '@/app/types/user';
import { aiUser } from '@/constants/aiUser';

interface UserSession {
  user: { id: string };
}

interface SnackbarConfig {
  message: string;
  color?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

interface ReviewCardProps {
  review: Review;
  user?: User;
  onDelete: (id: string) => void;
  showSnackbar: (config: SnackbarConfig) => void;
}

const MAX_CONTENT_LENGTH = 100;

const sections: { key: keyof Review['content']; title: string }[] = [
  { key: 'salary', title: 'Salary & Compensation' },
  { key: 'repertoire', title: 'Repertoire, Operas, Touring & Roles' },
  { key: 'staff', title: 'Staff, Classes & Rehearsals' },
  { key: 'schedule', title: 'Schedule & Holidays' },
  { key: 'facilities', title: 'Facilities, Wellbeing & Injuries' },
  { key: 'colleagues', title: 'Colleagues & General Mood' },
  { key: 'city', title: 'City, Transport & Living' },
];

export default function ReviewCard({ review, user, onDelete, showSnackbar }: ReviewCardProps) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [optionsButtonLayout, setOptionsButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const buttonRef = useRef<View>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data.session as UserSession | null);
    };
    fetchSession();
  }, []);

  const toggleSectionExpansion = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(review.id);
      setIsModalVisible(false);
    } catch (e: any) {
      showSnackbar({
        message: 'Error deleting review',
        color: '#EF4444',
        iconName: 'alert-circle-outline',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const content = typeof review.content === 'object' && review.content !== null
    ? review.content as Record<string, string>
    : {};

  const imageSource =
    review.visibility_type === 'anonymous'
      ? require('@/assets/images/favicon.png')
      : { uri: user?.profile_img || 'https://i.pravatar.cc/100?u=fallback' };


  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <Image
            source={imageSource}
            style={styles.avatar}
          />
          <View style={styles.nameWithTime}>
            <Text style={styles.username} numberOfLines={1}>
              {review.visibility_type === 'anonymous' ? 'Anonymous' : user?.name || 'Unknown'}
            </Text>
            <Text style={styles.timeAgo}>{timeAgo(review.created_at)}</Text>
          </View>
        </View>

        {(currentUser?.user.id === review.user_id && user?.user_id != aiUser.user_id) && (
          <Pressable
            ref={buttonRef}
            style={styles.optionsButton}
            onPress={() => {
              if (buttonRef.current) {
                buttonRef.current.measureInWindow((x, y, width, height) => {
                  setOptionsButtonLayout({ x, y, width, height });
                  setIsModalVisible(true);
                });
              }
            }}
          >
           <Ionicons name="ellipsis-vertical" size={18} color="#666" />
          </Pressable>
        )}
      </View>

      {/* Contenido dinámico */}
      {sections.map(({ key, title }) => {
        const value = content[key];
        if (!value?.trim()) return null;

        const isLong = value.length > MAX_CONTENT_LENGTH;
        const isExpanded = expandedSections[key];

        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>
              {isLong && !isExpanded ? `${value.slice(0, MAX_CONTENT_LENGTH)}...` : value}
            </Text>
            {isLong && (
              <Pressable onPress={() => toggleSectionExpansion(String(key))} style={styles.seeMoreButton}>
                <Text style={styles.seeMoreButtonText}>
                  {isExpanded ? 'See less' : 'See more'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {/* Rating */}
      {review.rating > 0 && (<View style={styles.ratingContainer}>
        {Array.from({ length: 5 }).map((_, i) => {
          const full = Math.floor(review.rating);
          const half = review.rating % 1 >= 0.5 && i === full;
          return (
            <Ionicons
              key={i}
              name={i < full ? 'star' : half ? 'star-half-outline' : 'star-outline'}
              size={16}
              color="#facc15"
            />
          );
        })}
      </View>
      )}

      {/* Modal de opciones */}
      <ReviewMenuOptions
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        position={optionsButtonLayout}
      />
    </View>
  );
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const seconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  const units = [
    { label: 'year', secs: 365 * 24 * 60 * 60 },
    { label: 'month', secs: 30 * 24 * 60 * 60 },
    { label: 'day', secs: 24 * 60 * 60 },
    { label: 'hour', secs: 60 * 60 },
    { label: 'minute', secs: 60 },
  ];

  for (let { label, secs } of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${label}${val > 1 ? 's' : ''} ago`;
  }

  return `${seconds} seconds ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
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
    alignSelf: 'flex-start',
  },
  seeMoreButtonText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
