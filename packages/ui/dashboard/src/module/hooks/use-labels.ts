import type { z } from "@medusajs/framework/zod";
import {
  COMMON_MESSAGES,
  featureLabel,
  humanizeValue,
  i18nKeys,
  type FeatureDef,
  type ModuleDef,
  type UiMessages,
} from "@repo/framework/core";
import { entityLabel, type EntityDef, type LabelContext } from "@repo/framework/entity";
import { getZodFieldInfo, getZodShape, pluralize } from "@repo/framework/utils";
import { startCase } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type AnyEntity = EntityDef<any, any, any>;
type Overrides = Record<string, Record<string, any>>;

/** Medusa admin actions (`actions.<key>`, translated by Medusa in every locale). */
const ACTIONS = {
  add: "Add",
  cancel: "Cancel",
  create: "Create",
  delete: "Delete",
  edit: "Edit",
  remove: "Remove",
  save: "Save",
  continue: "Continue",
  clear: "Clear",
  apply: "Apply",
} as const;

/**
 * Admin labels, translated when the module ships messages (see
 * `defineTranslations`), else the definition's label or one derived from the
 * key. Translations win over definition labels, which are the English default.
 */
export function useLabels() {
  const { t } = useTranslation();
  return useMemo(() => {
    const tr = (key: string, fallback: string) => t(key, { defaultValue: fallback }) as string;
    const labels = {
      module: (module: ModuleDef) => tr(i18nKeys.module(module.path), module.name),
      feature: (module: ModuleDef, feature: FeatureDef) =>
        tr(i18nKeys.feature(module.path, feature.key), featureLabel(feature)),
      step: (module: ModuleDef, feature: FeatureDef, step: { id: string; label: string }) =>
        tr(i18nKeys.step(module.path, feature.key, step.id), step.label),
      entity: (entity: AnyEntity, plural = false) =>
        tr(i18nKeys.entity(entity.name, plural), startCase(plural ? pluralize(entity.name) : entity.name)),
      /**
       * Field label: the entity's translation, else (for `<relation>_id`) the
       * relation's, else the shared one (`created_at`…), else `fallback`.
       */
      field: (entity: AnyEntity, field: string, fallback?: string): string => {
        const relation = field.endsWith("_id") ? field.slice(0, -3) : undefined;
        const shared = tr(i18nKeys.commonField(field), fallback ?? startCase(relation ?? field));
        const viaRelation = relation ? tr(i18nKeys.field(entity.name, relation), shared) : shared;
        return tr(i18nKeys.field(entity.name, field), viaRelation);
      },
      value: (entity: AnyEntity, field: string, value: string) =>
        tr(i18nKeys.value(entity.name, field, value), humanizeValue(value)),

      /** Dashboard UI text (`erp.ui.<key>`), with \`{{var}}\` values. */
      ui: (key: keyof UiMessages, vars: Record<string, string | number> = {}) =>
        t(i18nKeys.ui(key), { defaultValue: COMMON_MESSAGES.en.ui[key], ...vars }) as string,
      /** A Medusa admin action label ("Create", "Save"…), as Medusa translates it. */
      action: (key: keyof typeof ACTIONS) => tr(`actions.${key}`, ACTIONS[key]),
      /** A Medusa admin general word (\`general.<key>\`: "of", "results"…). */
      general: (key: string, fallback: string) => tr(`general.${key}`, fallback),
      /** Translations for record labels (enum values, units). */
      labelContext: {
        value: (entity: string, field: string, value: string) =>
          tr(i18nKeys.value(entity, field, value), humanizeValue(value)),
        text: (key: string, fallback: string) => tr(key, fallback),
      } satisfies LabelContext,
      /** A record's label in the user's language (see `entityLabel`). */
      record: (entity: AnyEntity, row: Record<string, any> | null | undefined) =>
        entityLabel(entity, row, labels.labelContext),

      /**
       * `overrides` with every field of `schema` labelled, and enum fields
       * given labelled options (form selects, filters, cells).
       */
      overrides<O extends object>(entity: AnyEntity, schema: z.ZodTypeAny, overrides: O = {} as O): O {
        const out: Overrides = { ...(overrides as Overrides) };
        for (const [key, field] of Object.entries(getZodShape(schema))) {
          const own = out[key] ?? {};
          const next: Record<string, any> = { ...own, label: labels.field(entity, key, own.label) };
          const info = getZodFieldInfo(field);
          if (info.baseType === "enum" && !own.options && info.enumValues) {
            next.options = info.enumValues.map((value) => ({ value, label: labels.value(entity, key, value) }));
          }
          out[key] = next;
        }
        return out as O;
      },
    };
    return labels;
  }, [t]);
}

export type Labels = ReturnType<typeof useLabels>;
