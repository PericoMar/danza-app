// components/common/IconBubble.tsx
import React from "react";
import { View } from "react-native";
import { Colors } from "../../theme/colors";

export default function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.purpleDark,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
      }}
    >
      {children}
    </View>
  );
}
