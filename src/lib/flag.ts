/** Converts a 2-letter ISO country code into its flag emoji via regional
 * indicator symbols (e.g. "us" -> 🇺🇸). No image assets or network needed. */
export function flagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🏳️";
  const codePoints = [...code].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
