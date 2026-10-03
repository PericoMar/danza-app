import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/insights';

/** Shown when the current user already has a review for this company. */
export default function AlreadyReviewedBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="checkmark-circle" size={17} color={Colors.successText} />
      <Text style={styles.text}>You have already reviewed this company.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  text: {
    fontFamily: INTER,
    fontSize: 14,
    color: Colors.successText,
  },
});
