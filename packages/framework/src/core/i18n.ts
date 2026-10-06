// Translations of a module's admin: the contract a module exports (typed
// messages per locale) and the keys the dashboard looks labels up by.
// Isomorphic: module definitions, admin code and tests share it.

/** Admin locales every module translates. English is the source. */
export const LOCALES = ["en", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

/** Labels of one entity: its name, its fields and its enum values. */
export interface EntityMessages {
  name?: string;
  plural?: string;
  fields?: Record<string, string>;
  /** Enum value labels by field: `{ fuel: { DIESEL: "Diesel" } }`. */
  values?: Record<string, Record<string, string>>;
}

/**
 * Messages of one module. `name`, `features` and `steps` label the module's
 * admin definition (by feature key); `entities` label its entities (by
 * entity name, wherever they show); `messages` holds the module's own UI text.
 */
export interface ModuleMessages {
  name?: string;
  features?: Record<string, string>;
  /** Wizard step labels by feature key, then step id. */
  steps?: Record<string, Record<string, string>>;
  entities?: Record<string, EntityMessages>;
  messages?: { [key: string]: string | ModuleMessages["messages"] };
}

/** The same keys as `T`, every leaf a string: what each locale must provide. */
export type SameShape<T> = { [K in keyof T]-?: T[K] extends string ? string : SameShape<NonNullable<T[K]>> };

/** A module's translations: English messages define the shape, other locales match it. */
export interface ModuleTranslations<T extends ModuleMessages = ModuleMessages> {
  /** The module's admin path (`vehicles`): its messages live under `modules.<path>`. */
  readonly module: string;
  readonly locales: { readonly en: T } & { readonly [L in Exclude<Locale, "en">]: SameShape<T> };
}

/**
 * Declares a module's translations. Every locale must have all the English
 * keys (a missing key is a type error).
 *
 * ```ts
 * export type VehicleMessages = typeof en;
 * export default defineTranslations("vehicles", { en, fr, ar });
 * ```
 */
export function defineTranslations<T extends ModuleMessages>(
  module: string,
  locales: { en: T } & { [L in Exclude<Locale, "en">]: SameShape<T> },
): ModuleTranslations<T> {
  return Object.freeze({ module, locales: locales as ModuleTranslations<T>["locales"] });
}

/** Labels of fields every entity has (`erp.fields.<field>`), shipped with every module set. */
export const COMMON_MESSAGES: Record<Locale, { fields: Record<string, string> }> = {
  en: { fields: { id: "ID", created_at: "Created", updated_at: "Updated", deleted_at: "Deleted" } },
  fr: { fields: { id: "ID", created_at: "Créé le", updated_at: "Modifié le", deleted_at: "Supprimé le" } },
  ar: { fields: { id: "المعرّف", created_at: "تاريخ الإنشاء", updated_at: "تاريخ التعديل", deleted_at: "تاريخ الحذف" } },
};

/**
 * Medusa admin i18n resources (`src/admin/i18n/index.ts` default export) for
 * these modules: module messages under `modules.<path>`, entity labels under
 * `entities.<Name>` (an entity reads the same in every module's pages).
 */
export function toAdminI18n(...translations: readonly ModuleTranslations<any>[]) {
  const resources = {} as Record<Locale, { translation: Record<string, any> }>;
  for (const locale of LOCALES) {
    const modules: Record<string, unknown> = {};
    const entities: Record<string, unknown> = {};
    for (const { module, locales } of translations) {
      const { entities: own = {}, ...rest } = locales[locale] as ModuleMessages;
      if (module in modules) throw new Error(`[toAdminI18n] module "${module}" is translated twice.`);
      modules[module] = rest;
      for (const [name, messages] of Object.entries(own)) {
        if (name in entities) throw new Error(`[toAdminI18n] entity "${name}" is translated by two modules.`);
        entities[name] = messages;
      }
    }
    resources[locale] = { translation: { modules, entities, erp: COMMON_MESSAGES[locale] } };
  }
  return resources;
}

/** Translation keys of admin labels (see `toAdminI18n` for the layout). */
export const i18nKeys = {
  module: (path: string) => `modules.${path}.name`,
  feature: (path: string, feature: string) => `modules.${path}.features.${feature}`,
  step: (path: string, feature: string, step: string) => `modules.${path}.steps.${feature}.${step}`,
  message: (path: string, key: string) => `modules.${path}.messages.${key}`,
  entity: (entity: string, plural = false) => `entities.${entity}.${plural ? "plural" : "name"}`,
  field: (entity: string, field: string) => `entities.${entity}.fields.${field}`,
  commonField: (field: string) => `erp.fields.${field}`,
  value: (entity: string, field: string, value: string) => `entities.${entity}.values.${field}.${value}`,
};

/** Default label of an enum value: "PLUG_IN_HYBRID" → "Plug in hybrid". */
export function humanizeValue(value: string): string {
  const words = value.replace(/[_-]+/g, " ").trim();
  if (!/[a-z]/.test(words) && words.length <= 3) return words;
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
