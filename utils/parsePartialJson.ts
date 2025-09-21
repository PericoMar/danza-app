// src/utils/parsePartialJson.ts
export const KEYS = [
  'salary',
  'repertoire',
  'staff',
  'schedule',
  'facilities',
  'colleagues',
  'city',
] as const;

export type ParsedContent = Record<typeof KEYS[number], string>;

export function parsePartialJson(raw: string): ParsedContent {
  const result = {} as ParsedContent;
  for (const key of KEYS) {
    const re = new RegExp(`"${key}"\\s*:\\s*"([^"]*)`);
    const m = re.exec(raw);
    result[key] = m ? m[1] : '';
  }
  return result;
}
