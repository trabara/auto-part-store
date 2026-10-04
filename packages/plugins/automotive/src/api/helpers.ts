import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { BaseEntity, QueryConfig } from "@medusajs/framework/types";
import { toSnakeCase } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { zodQueryResolve } from "@repo/framework/utils";
import { mapKeys, snakeCase } from "lodash";

export function validateAndTransformEntityQuery(
  schemas: Record<string, z.ZodType>,
  config: QueryConfig<BaseEntity> = {},
) {
  return (req, res, next) => {
    const entity = toSnakeCase(req.params.entity);

    const map = mapKeys(schemas, (_, k) => snakeCase(k));

    const schema = map[entity];

    const fields = zodQueryResolve(schema).split(",");

    return validateAndTransformQuery(createFindParams(), {
      defaults: ["id", "created_at", "updated_at"],
      allowed: fields,
      ...config,
    })(req, res, next);
  };
}

export function validateAndTransformEntityBody(
  schemas: Record<string, z.ZodType>,
) {
  return (req, res, next) => {
    const entity = toSnakeCase(req.params.entity);

    const map = mapKeys(schemas, (_, k) => snakeCase(k));

    const schema = map[entity];

    return validateAndTransformBody(schema)(req, res, next);
  };
}
