import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { BaseEntity, QueryConfig } from "@medusajs/framework/types";
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";
import { forEach, mapKeys, snakeCase } from "lodash";
import { z } from "zod";
import { getZodFieldInfo, getZodShape } from "../utils";

function buildFindParamsFilters(schema: z.ZodObject): z.ZodObject {
  const shape = getZodShape(schema);

  let params = z.object();
  forEach(shape, (field, key) => {
    const info = getZodFieldInfo(field);
    const PreProcessed = z.preprocess((v) => {
      if (info.baseType === "date") {
        return new Date(String(v));
      } else if (info.baseType === "number") {
        return Number(v);
      } else if (info.baseType === "array") {
        return JSON.parse(String(v));
      }
      return v;
    }, field);

    params = params.extend({
      [key]: createOperatorMap(PreProcessed).optional(),
    });
  });

  return params;
}

export function validateAndTransformEntityQuery(
  schemas: Record<string, z.ZodObject>,
  config: QueryConfig<BaseEntity> = {},
) {
  return (req: any, res: any, next: any) => {
    const entity = snakeCase(req.params.entity);

    const map = mapKeys(schemas, (_, k) => snakeCase(k));

    const findParams = createFindParams().extend({
      q: z.string().optional(),
      filters: buildFindParamsFilters(map[entity]!).optional(),
    });

    return validateAndTransformQuery(findParams, {
      defaults: ["id", "created_at", "updated_at"],
      ...config,
    })(req, res, next);
  };
}

export function validateAndTransformEntityBody(
  schemas: Record<string, z.ZodType>,
) {
  return (req: any, res: any, next: any) => {
    const entity = snakeCase(req.params.entity);
    const map = mapKeys(schemas, (_, k) => snakeCase(k));

    return validateAndTransformBody(map[entity]!)(req, res, next);
  };
}
