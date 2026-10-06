import type { z } from "@medusajs/framework/zod";
import {
  featureLabel,
  humanizeValue,
  i18nKeys,
  type FeatureDef,
  type ModuleDef,
} from "@repo/framework/core";
import type { EntityDef } from "@repo/framework/entity";
import { getZodFieldInfo, getZodShape, pluralize } from "@repo/framework/utils";
import { startCase } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type AnyEntity = EntityDef<any, any, any>;
type Overrides = Record<string, Record<string, any>>;

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
