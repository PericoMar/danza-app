import { View, Text, useWindowDimensions } from "react-native";
import { styles, heroFontSize } from "./styles";
import { NewsletterBenefits, type Benefit } from "./NewsletterBenefits";
import { NewsletterField } from "./NewsletterField";

type NotSubscribedViewProps = {
  userEmail?: string | null;
  email: string;
  onEmailChange: (email: string) => void;
  isSubmitting: boolean;
  onSubscribe: () => void;
  isSplit: boolean;
  suggestion: string | null;
  onAcceptSuggestion: () => void;
};

const BENEFITS: Benefit[] = [
  { icon: "time-outline", text: "Quick one minute read email. No unnecessary noise" },
  { icon: "notifications", text: "Only one email per week. No Spam" },
  {
    icon: "trending-up",
    text: "Direct links to each audition so you don't waste time looking for them",
  },
  { icon: "gift", text: "Easy and free" },
];

export function NotSubscribedView({
  userEmail,
  email,
  onEmailChange,
  isSubmitting,
  onSubscribe,
  isSplit,
  suggestion,
  onAcceptSuggestion,
}: NotSubscribedViewProps) {
  const { width } = useWindowDimensions();
  const isWide = isSplit;
  const heroSize = heroFontSize(width, isWide);

  return (
    <View style={styles.wrap}>
      <View style={[styles.eyebrow, !isWide && styles.eyebrowCentered]}>
        <View style={styles.eyebrowDot} />
        <Text style={styles.eyebrowText}>Every Sunday</Text>
      </View>

      <Text
        style={[
          styles.title,
          !isWide && styles.titleCentered,
          { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.04) },
        ]}
        accessibilityRole="header"
      >
        Auditions alert
      </Text>

      <Text
        style={[
          styles.subtitle,
          isWide ? styles.subtitleWide : styles.subtitleCompact,
        ]}
      >
        One email every Sunday summarizing all the auditions posted during the
        week. Join dancers who never miss an opportunity.
      </Text>

      <View style={{ width: "100%", marginTop: isWide ? 36 : 28 }}>
        <NewsletterField
          variant="light"
          isCompact={!isWide}
          email={email}
          onEmailChange={onEmailChange}
          onSubmit={onSubscribe}
          isSubmitting={isSubmitting}
          lockedEmail={userEmail}
          suggestion={suggestion}
          onAcceptSuggestion={onAcceptSuggestion}
        />

        <Text
          style={[styles.privacyNote, !isWide && styles.privacyNoteCentered]}
        >
          We respect your privacy. Unsubscribe anytime.
        </Text>
      </View>

      <NewsletterBenefits items={BENEFITS} isWide={isWide} />
    </View>
  );
}
