import { mapKeys, snakeCase, startCase } from "lodash";
import { TranslationFunction } from "../registry";
import { FeatureConfig } from "../types";
import { defineRouteConfig } from "@medusajs/admin-sdk";

export const defineFeatures = (
  name: string,
  routes: Record<string, FeatureConfig>,
) => {
  const getFeature = (
    entity: string,
    t?: TranslationFunction,
  ): FeatureConfig => {
    const entityKey = snakeCase(entity);

    const cfg = mapKeys(routes, (_, k) => snakeCase(k))[entityKey];
    if (cfg === undefined) {
      throw new Error(`${startCase(entityKey)} entity is not defined`);
    }

    cfg.entity = entityKey;
    return cfg;
  };

  const getRouteConfig = () => {
    return {
      label: name,
      // @ts-ignore
      items: Object.keys(routes).map((route) => {
        const feature = getFeature(route);
        return {
          param: feature.path,
          label: startCase(feature.entity),
        };
      }),
    };
  };

  return { getFeature, getRouteConfig };
};
