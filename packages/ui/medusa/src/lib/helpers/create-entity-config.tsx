import { z } from "@medusajs/framework/zod";
import { mapKeys, snakeCase, startCase } from "lodash";
import { FieldValues } from "react-hook-form";
import { TranslationFunction } from "../registry";
import { CrudConfig, MedusaFieldOverrides } from "../types";

type EntityFieldConfigs<L extends FieldValues = {}> = (
  t: TranslationFunction,
) => MedusaFieldOverrides<L> | MedusaFieldOverrides<L>;

type EntityFeature<S extends FieldValues = {}> = [
  z.ZodObject<S>,
  EntityFieldConfigs<S>?,
];

type EntitySchemaConfig<
  S extends FieldValues = {},
  L extends FieldValues = {},
  C extends FieldValues = {},
  U extends FieldValues = {},
> = {
  schema: z.ZodObject<S>;
  list: EntityFeature<L>;
  create: EntityFeature<C>;
  update: EntityFeature<U>;
};

export const createEntityConfigs = (
  path: string,
  configMap: Record<string, EntitySchemaConfig>,
) => {
  return (entity: string, t: TranslationFunction): CrudConfig => {
    const key = snakeCase(entity);
    const name = startCase(key);

    const cfg = mapKeys(configMap, (_, k) => snakeCase(k))[key];

    if (cfg === undefined) {
      throw new Error(`${name} entity is not defined`);
    }

    const [listSchema, listFields] = cfg.list;
    const [createSchema, createFields] = cfg.create;
    const [editSchema, editFields] = cfg.update;

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
      name,
      path: path + "/" + entity,
      entitySchema: cfg.schema,
      listSchema,
      listFields: bindFields(listFields),
      createSchema,
      createFields: bindFields(createFields),
      editSchema,
      editFields: bindFields(editFields),
    };
  };
};
