import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NL, styles } from "./styles";

export type Benefit = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
};

type NewsletterBenefitsProps = {
  items: Benefit[];
  /** Wide layout lays the list out in two columns; compact stacks it. */
  isWide: boolean;
};

/**
 * The "why subscribe" bullets, restyled for the editorial black-on-white hero:
 * a hairline-ruled block with the original chip icons, now in plain black.
 */
export function NewsletterBenefits({ items, isWide }: NewsletterBenefitsProps) {
  return (
    <View style={styles.benefits}>
      <View style={isWide ? styles.benefitsGrid : styles.benefitsColumn}>
        {items.map((item) => (
          <View
            key={item.text}
            style={[styles.benefitItem, isWide && styles.benefitItemWide]}
          >
            <View style={styles.benefitMarker}>
              <Ionicons name={item.icon} size={17} color={NL.ink} />
            </View>
            <Text style={styles.benefitText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
