// components/companies/EventParticipationBanner.tsx
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ParticipatingEvent } from '@/types/company';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';

type Props = {
  events: ParticipatingEvent[];
  onEventPress: (eventId: string) => void;
  /** Clamp the text (with an ellipsis); omitted, every event name shows. */
  maxLines?: number;
  /** Outer frame (position, size, padding, borders, radius): the card and the company page differ there. */
  style?: StyleProp<ViewStyle>;
};

// Joins the event names as "A", "A and B", "A, B and C".
function separatorBefore(index: number, count: number): string {
  if (index === 0) return '';
  return index === count - 1 ? ' and ' : ', ';
}

/** Pink banner saying the company also takes part in events' live auditions. */
export default function EventParticipationBanner({ events, onEventPress, maxLines, style }: Props) {
  if (events.length === 0) return null;

  return (
    <View style={[styles.banner, style]}>
      <Ionicons name="ticket-outline" size={15} color={Colors.pinkDark} />
      <Text style={styles.text} numberOfLines={maxLines}>
        Also participating in{' '}
        {events.map((event, index) => (
          <Text key={event.id}>
            {separatorBefore(index, events.length)}
            <Text
              style={styles.eventName}
              onPress={() => onEventPress(event.id)}
              accessibilityRole="link"
            >
              {event.name}
            </Text>
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.pinkTint,
  },
  text: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: Colors.text,
  },
  eventName: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: Colors.pinkSoft,
  },
});
