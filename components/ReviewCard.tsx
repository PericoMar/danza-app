import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '@/hooks/useReviews';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { aiUser } from '@/constants/aiUser';
import NewReviewModal from './modals/newReviewModal';
import { VisibilityType } from './ui/VisibilityTags';
import { router } from 'expo-router';
import ReviewMenuOptions from './modals/ReviewMenuOptions';
import { User } from '@/types/user';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER } from '@/theme/insights';
import { REVIEW_SECTION_CLAMP_MIN_CHARS } from '@/constants/layout';
import { ToastTone } from '@/constants/toast';
import { useToast } from '@/providers/ToastProvider';

interface UserSession {
  user: { id: string };
}

interface ReviewCardProps {
  review: Review;
  user?: User;
  onDelete: (id: string) => void;
}

const sections: { key: keyof Review['content']; title: string }[] = [
  { key: 'salary', title: 'Salary & Compensation' },
  { key: 'repertoire', title: 'Repertoire, Operas, Touring & Roles' },
  { key: 'staff', title: 'Staff, Classes & Rehearsals' },
  { key: 'schedule', title: 'Schedule & Holidays' },
  { key: 'facilities', title: 'Facilities, Wellbeing & Injuries' },
  { key: 'colleagues', title: 'Colleagues & General Mood' },
  { key: 'city', title: 'City, Transport & Living' },
];

export default function ReviewCard({ review, user, onDelete }: ReviewCardProps) {

  if (review.hidden) {
    return null;
  }

  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [optionsButtonLayout, setOptionsButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const buttonRef = useRef<View>(null);

  // Editar review
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);

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
      showToast({
        message: 'Error deleting review',
        tone: ToastTone.ERROR,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateReview = async (payload: {
    content: any; visibility_type: VisibilityType; rating: number;
  }) => {
    if (!editingReview) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          content: payload.content,
          visibility_type: payload.visibility_type,
          rating: payload.rating,
        })
        .eq('id', editingReview.id)
        .eq('user_id', user?.user_id); // safety: solo el autor

      if (error) throw error;

      setEditModalVisible(false);
      setEditingReview(null);
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        // For native: force remount of the screen
        router.reload();
      }
    } catch (e: any) {
      showToast({
        message: 'Error updating review',
        tone: ToastTone.ERROR,
      });
    }
  };

  const content = typeof review.content === 'object' && review.content !== null
    ? review.content as Record<string, string>
    : {};

  const isAi = user?.user_id === aiUser.user_id;
  const isAnonymous = review.visibility_type === 'anonymous';

  let imageSource;
  if (isAi) {
    imageSource = require('@/assets/images/ai-summary-profile-pic.png');
  } else if (isAnonymous) {
    imageSource = require('@/assets/images/favicon.png');
  } else {
    imageSource = { uri: user?.profile_img || 'https://i.pravatar.cc/100?u=fallback' };
  }

  const displayName = isAnonymous ? 'Anonymous' : user?.name || 'Unknown';
  const canManage = currentUser?.user.id === review.user_id && !isAi;

  return (
    <View style={[styles.card, isAi && styles.cardAi]}>
      <View style={styles.top}>
        <Image source={imageSource} style={[styles.avatar, isAi && styles.avatarAi]} />

        <View style={styles.who}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.when}>{timeAgo(review.created_at)}</Text>
        </View>

        {review.rating > 0 && (
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => {
              const full = Math.floor(review.rating);
              const half = review.rating % 1 >= 0.5 && i === full;
              return (
                <Ionicons
                  key={i}
                  name={i < full ? 'star' : half ? 'star-half-outline' : 'star-outline'}
                  size={15}
                  color={Colors.grey1}
                />
              );
            })}
            <Text style={styles.ratingValue}>{review.rating.toFixed(1)}</Text>
          </View>
        )}

        {canManage && (
          <Pressable
            ref={buttonRef}
            style={styles.kebab}
            accessibilityRole="button"
            accessibilityLabel="Review options"
            onPress={() => {
              if (buttonRef.current) {
                buttonRef.current.measureInWindow((x, y, width, height) => {
                  setOptionsButtonLayout({ x, y, width, height });
                  setIsModalVisible(true);
                });
              }
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.sections}>
        {sections.map(({ key, title }) => {
          const value = content[key];
          if (!value?.trim()) return null;

          const isLong = value.length > REVIEW_SECTION_CLAMP_MIN_CHARS;
          const isExpanded = expandedSections[key];

          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionBody}>
                {isLong && !isExpanded
                  ? `${value.slice(0, REVIEW_SECTION_CLAMP_MIN_CHARS)}...`
                  : value}
              </Text>
              {isLong && (
                <Pressable onPress={() => toggleSectionExpansion(String(key))}>
                  <Text style={styles.seeMore}>{isExpanded ? 'See less' : 'See more'}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <ReviewMenuOptions
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        onEdit={() => {
          setIsModalVisible(false);
          setEditingReview(review);
          setEditModalVisible(true);
        }}
        position={optionsButtonLayout}
      />

      <NewReviewModal
        visible={editModalVisible}
        onClose={() => { setEditModalVisible(false); setEditingReview(null); }}
        onSubmit={handleUpdateReview}
        mode="edit"
        submitLabel="Save"
        initial={editingReview ? {
          content: editingReview.content ?? {},
          visibility_type: editingReview.visibility_type ?? 'anonymous',
          rating: editingReview.rating ?? 0,
        } : null}
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

  if (seconds < 60) return `now`;

  return `${seconds} seconds ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 18px 42px -30px rgba(0,0,0,0.16)' },
      default: {},
    }),
  },
  cardAi: {
    backgroundColor: Colors.specSurface,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.chromeSoft,
  },
  avatarAi: {
    backgroundColor: Colors.pink,
  },
  who: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: DISPLAY,
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.text,
  },
  when: {
    fontFamily: INTER,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  ratingValue: {
    fontFamily: INTER,
    fontSize: 10.5,
    letterSpacing: 1,
    color: Colors.textMuted,
    marginLeft: 5,
  },
  kebab: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null),
  },
  sections: {
    marginTop: 18,
    gap: 16,
  },
  section: {
    gap: 5,
  },
  sectionTitle: {
    fontFamily: INTER,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  sectionBody: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textLightDark,
  },
  seeMore: {
    fontFamily: INTER,
    marginTop: 6,
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
