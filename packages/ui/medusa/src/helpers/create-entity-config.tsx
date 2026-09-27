import { lowerCase, mapKeys, snakeCase, startCase } from "lodash";
import { TranslationFunction } from "../registry";
import { EntityConfig, EntityFieldConfigs } from "../types";

export const createEntityPages = (
  path: string,
  configMap: Record<string, EntityConfig>,
) => {
  return (entity: string, t: TranslationFunction): EntityConfig => {
    const entityKey = snakeCase(entity);

    const cfg = mapKeys(configMap, (_, k) => snakeCase(k))[entityKey];

    if (cfg === undefined) {
      throw new Error(`${startCase(entityKey)} entity is not defined`);
    }

    function bindFields(fields?: EntityFieldConfigs) {
      if (fields === undefined) {
        return {};
      }
      if (typeof fields === "function") {
        return fields(t);
      }
      return fields;
    }

    return {
      ...cfg,
      entity: entityKey,
      path: path + "/" + snakeCase(lowerCase(entity)),
    };
  };
};
