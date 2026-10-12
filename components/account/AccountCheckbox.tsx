import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { webPointer } from "./styles";

type AccountCheckboxProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

/** Square monochrome checkbox with a tappable label. */
export function AccountCheckbox({ label, checked, onToggle, disabled = false }: AccountCheckboxProps) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      style={[styles.row, !disabled && webPointer]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={15} color={Colors.white} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.ruleStrong,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  label: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
});
