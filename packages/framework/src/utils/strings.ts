export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * English plural of a (Pascal/camel-cased) name, for URL paths: `Vehicle` →
 * `Vehicles`, `Category` → `Categories`, `Box` → `Boxes`. Isomorphic, unlike
 * Medusa's `pluralize` (server utils).
 */
export function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + "es";
  return word + "s";
}

/** Default label of an enum value: "PLUG_IN_HYBRID" → "Plug in hybrid". */
export function humanizeValue(value: string): string {
  const words = value.replace(/[_-]+/g, " ").trim();
  if (!/[a-z]/.test(words) && words.length <= 3) return words;
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
