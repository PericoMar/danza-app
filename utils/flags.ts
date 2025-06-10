// Convierte "US" => 🇺🇸, "ES" => 🇪🇸 ...
export const flagEmoji = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
};
