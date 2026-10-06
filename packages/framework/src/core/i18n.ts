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

/** Admin UI text of the dashboard templates (`erp.ui.<key>`; i18next `{{var}}` interpolation). */
const UI_EN = {
  createEntity: "Create {{name}}",
  editEntity: "Edit {{name}}",
  addEntity: "Add {{name}}",
  created: "{{name}} created",
  updated: "{{name}} updated",
  added: "{{name}} added",
  removed: "{{name}} removed",
  deleted: "Deleted",
  createFailed: "Failed to create {{name}}",
  updateFailed: "Failed to update {{name}}",
  addFailed: "Failed to add {{name}}",
  removeFailed: "Failed to remove {{name}}",
  deleteFailed: "Failed to delete",
  deleteConfirm: "Delete {{count}} item(s)?",
  cannotUndo: "This can't be undone.",
  loading: "Loading…",
  notFound: "Not found",
  accessDenied: "Access denied",
  empty: "Nothing here yet.",
  search: "Search…",
  select: "Select",
  selectEntity: "Select {{name}}",
  filterBy: "Filter by {{name}}",
  required: "Required",
  validationFailed: "Validation failed",
  upload: "Upload",
  replace: "Replace",
  removeItem: "Remove {{name}}",
  bulkActions: "Bulk actions ({{count}} selected)",
  rangeFrom: "From",
  rangeTo: "To",
  rangeBetween: "Between",
  today: "Today",
  yesterday: "Yesterday",
  lastWeek: "Last week",
  none: "— None",
  open: "Open",
  saved: "Saved",
  saveFailed: "Failed to save",
  checkFields: "Check the highlighted fields and try again.",
  noResultsFor: "No results for “{{q}}”",
  nothingToChoose: "Nothing to choose yet",
  showingFirst: "Showing the first {{count}}: type to narrow.",
};

export type UiMessages = typeof UI_EN;

/**
 * Messages every module set ships (`erp.*`): labels of fields every entity
 * has (`erp.fields.<field>`) and the dashboard's UI text (`erp.ui.<key>`).
 */
export const COMMON_MESSAGES: Record<Locale, { fields: Record<string, string>; ui: UiMessages }> = {
  en: {
    fields: { id: "ID", created_at: "Created", updated_at: "Updated", deleted_at: "Deleted" },
    ui: UI_EN,
  },
  fr: {
    fields: { id: "ID", created_at: "Créé le", updated_at: "Modifié le", deleted_at: "Supprimé le" },
    // Neutral phrasing: entity names have a grammatical gender.
    ui: {
      createEntity: "Créer : {{name}}",
      editEntity: "Modifier : {{name}}",
      addEntity: "Ajouter : {{name}}",
      created: "{{name}} : création effectuée",
      updated: "{{name}} : modifications enregistrées",
      added: "{{name}} : ajout effectué",
      removed: "{{name}} : suppression effectuée",
      deleted: "Suppression effectuée",
      createFailed: "Échec de la création : {{name}}",
      updateFailed: "Échec de la modification : {{name}}",
      addFailed: "Échec de l'ajout : {{name}}",
      removeFailed: "Échec de la suppression : {{name}}",
      deleteFailed: "Échec de la suppression",
      deleteConfirm: "Supprimer {{count}} élément(s) ?",
      cannotUndo: "Cette action est irréversible.",
      loading: "Chargement…",
      notFound: "Introuvable",
      accessDenied: "Accès refusé",
      empty: "Aucun élément pour le moment.",
      search: "Rechercher…",
      select: "Sélectionner",
      selectEntity: "Sélectionner : {{name}}",
      filterBy: "Filtrer par {{name}}",
      required: "Obligatoire",
      validationFailed: "Formulaire incomplet",
      upload: "Téléverser",
      replace: "Remplacer",
      removeItem: "Retirer {{name}}",
      bulkActions: "Actions groupées ({{count}} sélectionné(s))",
      rangeFrom: "Du",
      rangeTo: "Au",
      rangeBetween: "Entre",
      today: "Aujourd'hui",
      yesterday: "Hier",
      lastWeek: "Semaine dernière",
      none: "— Aucun",
      open: "Ouvrir",
      saved: "Enregistré",
      saveFailed: "Échec de l'enregistrement",
      checkFields: "Vérifiez les champs signalés et réessayez.",
      noResultsFor: "Aucun résultat pour « {{q}} »",
      nothingToChoose: "Aucun choix disponible",
      showingFirst: "{{count}} premiers résultats : tapez pour affiner.",
    },
  },
  ar: {
    fields: { id: "المعرّف", created_at: "تاريخ الإنشاء", updated_at: "تاريخ التعديل", deleted_at: "تاريخ الحذف" },
    ui: {
      createEntity: "إنشاء {{name}}",
      editEntity: "تعديل {{name}}",
      addEntity: "إضافة {{name}}",
      created: "تم إنشاء {{name}}",
      updated: "تم تحديث {{name}}",
      added: "تمت إضافة {{name}}",
      removed: "تمت إزالة {{name}}",
      deleted: "تم الحذف",
      createFailed: "تعذّر إنشاء {{name}}",
      updateFailed: "تعذّر تحديث {{name}}",
      addFailed: "تعذّرت إضافة {{name}}",
      removeFailed: "تعذّرت إزالة {{name}}",
      deleteFailed: "تعذّر الحذف",
      deleteConfirm: "حذف {{count}} عنصر؟",
      cannotUndo: "لا يمكن التراجع عن هذا الإجراء.",
      loading: "جارٍ التحميل…",
      notFound: "غير موجود",
      accessDenied: "تم رفض الوصول",
      empty: "لا توجد عناصر بعد.",
      search: "بحث…",
      select: "اختر",
      selectEntity: "اختر {{name}}",
      filterBy: "تصفية حسب {{name}}",
      required: "مطلوب",
      validationFailed: "النموذج غير مكتمل",
      upload: "رفع",
      replace: "استبدال",
      removeItem: "إزالة {{name}}",
      bulkActions: "إجراءات جماعية ({{count}} محدد)",
      rangeFrom: "من",
      rangeTo: "إلى",
      rangeBetween: "بين",
      today: "اليوم",
      yesterday: "أمس",
      lastWeek: "الأسبوع الماضي",
      none: "— لا شيء",
      open: "فتح",
      saved: "تم الحفظ",
      saveFailed: "تعذّر الحفظ",
      checkFields: "تحقق من الحقول المحددة وحاول مرة أخرى.",
      noResultsFor: "لا نتائج لـ «{{q}}»",
      nothingToChoose: "لا توجد خيارات بعد",
      showingFirst: "أول {{count}} نتيجة: اكتب للتضييق.",
    },
  },
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
  ui: (key: keyof UiMessages) => `erp.ui.${key}`,
  value: (entity: string, field: string, value: string) => `entities.${entity}.values.${field}.${value}`,
};

export { humanizeValue } from "../utils/strings";
