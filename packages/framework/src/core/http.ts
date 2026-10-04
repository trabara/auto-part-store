import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { BaseEntity, QueryConfig } from "@medusajs/framework/types";
import { toSnakeCase } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { mapKeys, snakeCase } from "lodash";
import { buildFindParamsFilters } from "../utils/validation";

export function validateAndTransformEntityQuery(
  schemas: Record<string, z.ZodObject>,
  config: QueryConfig<BaseEntity> = {},
) {
  return (req: any, res: any, next: any) => {
    const entity = toSnakeCase(req.params.entity);

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
    const entity = toSnakeCase(req.params.entity);

    const map = mapKeys(schemas, (_, k) => snakeCase(k));
    return validateAndTransformBody(map[entity]!)(req, res, next);
  };
}
