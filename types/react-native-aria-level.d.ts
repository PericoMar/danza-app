import 'react-native';

declare module 'react-native' {
  interface AccessibilityProps {
    /** Heading level; react-native-web renders `accessibilityRole="header"` as <h{level}>. */
    'aria-level'?: number;
  }
}
