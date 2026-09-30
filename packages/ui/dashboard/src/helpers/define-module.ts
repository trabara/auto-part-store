import { kebabCase, mapKeys, snakeCase, startCase } from "lodash";
import { TranslationFunction } from "../registry";
import { FeatureConfig, MedusaModule, ModuleDef } from "../types";

import "@medusajs/admin-sdk";
import type { ComponentType } from "react";

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

export const defineModule = ({
  features = {},
  ...rest
}: ModuleDef): MedusaModule => {
  const getFeature = (
    entity: string,
    t?: TranslationFunction,
  ): FeatureConfig => {
    const entityKey = snakeCase(entity);
    const entityName = startCase(entityKey);

    const cfg = mapKeys(features, (_, k) => snakeCase(k))[entityKey];
    if (cfg === undefined) {
      throw new Error(`${entityName} entity is not defined`);
    }

    return cfg;
  };

  const getRouter = () => ({
    label: rest.name,
    items: Object.keys(features).map((route) => {
      return {
        param: kebabCase(route),
        label: startCase(route),
      };
    }),
  });

  return {
    ...rest,
    getFeature,
    getRouter,
  };
};
