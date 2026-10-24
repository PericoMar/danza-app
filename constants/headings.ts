/**
 * Heading levels. On web react-native-web turns a `header` role plus
 * `aria-level` into <h1>…<h6>; native screen readers only see "header".
 * One PAGE heading per screen, its sections one level below.
 */
export const HeadingLevel = {
  PAGE: 1,
  SECTION: 2,
} as const;
export type HeadingLevel = (typeof HeadingLevel)[keyof typeof HeadingLevel];
