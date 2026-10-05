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
