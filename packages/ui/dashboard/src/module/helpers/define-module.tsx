import { kebabCase, mapKeys, snakeCase, startCase } from "lodash";

import "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { getZodFieldInfo, getZodShape, unwrap } from "@repo/utils";
import type { ComponentType } from "react";
import { TranslationFunction } from "../../form/registry";
import { RelationSelect } from "../components/relation-select";
import {
  FeatureConfig,
  FeatureFieldOverrides,
  ModuleDef,
  ModuleType,
} from "../types";
import { DataTable } from "../components/data-table";

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

  const buildRelationFields = (entity: string, schema: z.ZodSchema) => {
    const feature = getFeature(entity);
    const entityShape = getZodShape(feature.entity);
    const shape = getZodShape(schema);

    return Object.keys(shape).reduce(
      (prev: FeatureFieldOverrides<any>, fieldKey) => {
        let key = fieldKey;
        if (fieldKey.endsWith("_id")) {
          key = fieldKey.split("_")[0]!;
        }

        const field = entityShape[key];
        if (!field) {
          return prev;
        }

        const entityIds = Object.keys(getFeatures());
        const entityId =
          entityIds.find((entityId) => entityId.includes(key)) || key;

        const fieldInfo = getZodFieldInfo(field);

        const label = startCase(entityId);
        if (
          fieldInfo.baseType === "object" ||
          (fieldInfo.baseType === "string" && fieldKey.endsWith("_id"))
        ) {
          const fields = Object.keys(getZodShape(field));
          prev[fieldKey] = {
            label,
            render: (props) => (
              <RelationSelect
                defaultValue={props.value}
                onChange={props.onChange}
                path={def.path}
                entity={entityId}
                fields={fields}
                mapper={(item: any) => {
                  return { value: item.id, label: item.name };
                }}
              />
            ),
          };
        } else if (fieldInfo.baseType === "array") {
          prev[fieldKey] = {
            label,
            hideLabel: true,
            render: (props) => (
              <DataTable
                id={entity}
                overrides={{}}
                schema={fieldInfo.unwrapped}
                queryFn={(signal, params) =>
                  Promise.resolve({ data: [], metadata: { count: 0 } })
                }
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
    buildRelationFields,
  };
};
