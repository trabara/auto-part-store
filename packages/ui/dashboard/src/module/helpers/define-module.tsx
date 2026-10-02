import { kebabCase, mapKeys, snakeCase, startCase } from "lodash";

import "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { getZodFieldInfo, getZodShape } from "@repo/utils";
import type { ComponentType } from "react";
import { TranslationFunction } from "../../form/registry";
import { RelationManyTable } from "../components/relation-many-table";
import { RelationSelect } from "../components/relation-select";
import {
  FeatureConfig,
  FeatureFieldOverrides,
  ModuleDef,
  ModuleType,
} from "../types";

declare module "@medusajs/admin-sdk" {
  interface RouteConfig {
    /** Expands a dynamic route ([param]) into one sidebar item per entry. */
    items?: Array<{
      param: string;
      label: string;
      icon?: ComponentType;
      rank?: number;
      translationNs?: string;
    }>;
  }
}

export const defineModule = (def: ModuleDef): ModuleType => {
  const featureMap = mapKeys(def.features, (_, k) => snakeCase(k));

  const getFeature = (
    entity: string,
    t?: TranslationFunction,
  ): FeatureConfig => {
    const entityKey = snakeCase(entity);
    const entityName = startCase(entityKey);

    const feature = featureMap[entityKey];
    if (feature === undefined) {
      throw new Error(`${entityName} entity is not defined`);
    }

    return feature;
  };

  const getRouter = () => ({
    label: def.name,
    items: Object.keys(featureMap).map((route) => {
      return {
        param: kebabCase(route),
        label: startCase(route),
      };
    }),
  });

  const getFeatures = () => {
    return featureMap;
  };

  const buildRelationOverrides = (
    entity: string,
    schema: z.ZodTypeAny,
  ): FeatureFieldOverrides<any> => {
    const feature = getFeature(entity);
    const entityShape = getZodShape(feature.entity);
    const shape = getZodShape(schema);
    const relations = feature.relations ?? {};

    return Object.keys(shape).reduce(
      (prev: FeatureFieldOverrides<any>, fieldKey) => {
        const explicit = relations[fieldKey];
        const field = entityShape[fieldKey];
        if (!field && !explicit) {
          return prev;
        }

        // ── Explicit relation config (preferred) ──────────────
        if (explicit) {
          if (explicit.type === "hasMany") {
            const targetFeature = getFeatures()[explicit.targetEntity];
            const targetShape = targetFeature
              ? getZodShape(targetFeature.entity)
              : {};
            prev[fieldKey] = {
              label: startCase(fieldKey),
              hideLabel: true,
              render: () => (
                <RelationManyTable
                  parentEntity={entity}
                  relationKey={fieldKey}
                  targetEntity={explicit.targetEntity}
                  fields={
                    explicit.fields ?? Object.keys(targetShape ?? {})
                  }
                />
              ),
            };
          } else {
            prev[fieldKey] = {
              label: startCase(explicit.displayField ?? explicit.targetEntity),
              render: (props) => (
                <RelationSelect
                  defaultValue={props.value}
                  onChange={props.onChange}
                  path={def.path}
                  entity={explicit.targetEntity}
                  fields={explicit.fields ?? ["id", "name"]}
                  displayField={explicit.displayField ?? "name"}
                />
              ),
            };
          }
          return prev;
        }

        // ── Auto-detection fallback ──────────────────────────
        if (!field) {
          return prev;
        }

        // Strip a trailing _id to get the relation key
        // (model_id → model, parent_category_id → parent_category)
        const relationKey = fieldKey.replace(/_id$/, "");
        const hasIdSuffix = relationKey !== fieldKey;

        // Resolve the target entity: prefer an exact match, then
        // fall back to a suffix match so model_id → vehicle_model
        const entityKeys = Object.keys(getFeatures());
        const targetEntity =
          entityKeys.find((k) => k === relationKey) ??
          entityKeys.find((k) => k === `vehicle_${relationKey}`) ??
          relationKey;

        const fieldInfo = getZodFieldInfo(field);
        const label = startCase(targetEntity);

        if (
          fieldInfo.baseType === "object" ||
          (fieldInfo.baseType === "string" && hasIdSuffix)
        ) {
          const fields = Object.keys(getZodShape(field));
          prev[fieldKey] = {
            label,
            render: (props) => (
              <RelationSelect
                defaultValue={props.value}
                onChange={props.onChange}
                path={def.path}
                entity={targetEntity}
                fields={fields.length > 0 ? fields : ["id", "name"]}
                displayField="name"
              />
            ),
          };
        } else if (fieldInfo.baseType === "array") {
          prev[fieldKey] = {
            label,
            hideLabel: true,
            render: () => (
              <RelationManyTable
                parentEntity={entity}
                relationKey={fieldKey}
                targetEntity={targetEntity}
                fields={Object.keys(getZodShape(fieldInfo.unwrapped))}
              />
            ),
          };
        }

        return prev;
      },
      {},
    );
  };

  return {
    ...def,
    getFeature,
    getRouter,
    getFeatures,
    buildRelationOverrides,
  };
};
