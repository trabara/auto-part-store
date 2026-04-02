// =============================================================================
// Translation Registry
// =============================================================================

/**
 * Translation function type
 */
export type TranslationFunction = (key: string) => string;

/**
 * Custom translation function (set via setupForm)
 */
let customTranslateFn: TranslationFunction | null = null;

/**
 * Translate a key using the registered translate function.
 * Returns the key as-is if no function registered or translation not found.
 */
const translate = (key: string): string => {
  if (customTranslateFn) {
    return customTranslateFn(key);
  }
  return key;
};

// =============================================================================
// Registration API
// =============================================================================

/**
 * Set the translation function.
 * Called internally by setupForm.
 *
 * @param fn - Translation function (e.g., i18next t function)
 *
 * @example
 * ```typescript
 * import { useTranslation } from 'react-i18next';
 *
 * const { t } = useTranslation('data');
 * setTranslationFunction(t);
 * ```
 */
export function setTranslationFunction(fn: TranslationFunction): void {
  customTranslateFn = fn;
}

/**
 * Get the translate function.
 * Used internally by SnowForm components.
 *
 * @returns The translate function
 */
export function getT(): TranslationFunction {
  return translate;
}

// =============================================================================
// Reset (useful for testing)
// =============================================================================

/**
 * Reset translation registry to defaults (mainly for testing)
 */
export function resetTranslationRegistry(): void {
  customTranslateFn = null;
}
