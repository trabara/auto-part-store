import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { BaseEntity, QueryConfig } from "@medusajs/framework/types";
import { toSnakeCase } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import {
  getZodFieldInfo,
  getZodShape,
  snakeCase,
  zodQueryResolve,
} from "@repo/utils";
import { forEach, mapKeys } from "lodash";

function buildFilters(schema: z.ZodObject): z.ZodObject {
  let filters = z.object();
  const shape = getZodShape(schema);

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

    filters = filters.extend({
      [key]: createOperatorMap(PreProcessed).optional(),
    });
  });

  return filters;
}

function buildFindParamsSchema(schema: z.ZodObject): z.ZodObject {
  return createFindParams().extend({
    q: z.string(),
    filters: buildFilters(schema).optional(),
  });
}

export function validateAndTransformEntityQuery(
  schemas: Record<string, z.ZodObject>,
  config: QueryConfig<BaseEntity> = {},
) {
  return (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ) => {
    const entity = toSnakeCase(req.params.entity);

    const map = mapKeys(schemas, (_, k) => snakeCase(k));

    const findParams = buildFindParamsSchema(map[entity!]);

    return validateAndTransformQuery(findParams, {
      defaults: ["id", "created_at", "updated_at"],
      ...config,
    })(req, res, next);
  };
}

export function validateAndTransformEntityBody(
  schemas: Record<string, z.ZodType>,
) {
  return (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ) => {
    const entity = toSnakeCase(req.params.entity);

    const map = mapKeys(schemas, (_, k) => snakeCase(k));

    return validateAndTransformBody(map[entity])(req, res, next);
  };
}
