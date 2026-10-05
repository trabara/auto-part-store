import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import type { BaseEntity, QueryConfig } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import { mapKeys, mapValues, snakeCase } from "lodash";
import { getZodFieldInfo, getZodShape, zodQueryResolve } from "../utils";

export type Middleware = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => unknown;

/** Query keys owned by `createFindParams`; never used as filter names. */
const RESERVED_QUERY_KEYS = new Set([
  "q",
  "fields",
  "offset",
  "limit",
  "order",
  "with_deleted",
]);

function parseJsonOrRaw(v: unknown): unknown {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    // Let Zod report the bad value as a validation error (400).
    return v;
  }
}

function parseBoolean(v: unknown): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
}

/**
 * Query-string-friendly schema for one filterable field, or `undefined` when
 * the field is a relation (object / array of objects) and is not filterable
 * at the top level.
 */
function filterValueSchema(field: z.ZodTypeAny): z.ZodTypeAny | undefined {
  const info = getZodFieldInfo(field);
  switch (info.baseType) {
    case "string":
      return z.string();
    case "number":
      return z.coerce.number();
    case "boolean":
      return z.preprocess(parseBoolean, z.boolean());
    case "date":
      return z.coerce.date();
    case "enum":
      return info.unwrapped;
    case "array":
      return info.arrayElementInfo?.baseType === "object"
        ? undefined
        : z.preprocess(parseJsonOrRaw, info.unwrapped);
    default:
      return undefined;
  }
}

/**
 * Operator-map filters (`field`, `field[$gte]`, ...) for every scalar field of
 * an entity schema. Relations and reserved query keys are skipped.
 */
export function buildEntityFilters(schema: z.ZodTypeAny) {
  const filters: Record<string, z.ZodTypeAny> = {};
  for (const [key, field] of Object.entries(getZodShape(schema))) {
    if (RESERVED_QUERY_KEYS.has(key)) continue;
    const value = filterValueSchema(field);
    if (value) filters[key] = createOperatorMap(value).optional();
  }
  return filters;
}

/**
 * Field paths a client may select, in the format Medusa's `allowed` query
 * config expects: every leaf path plus every relation prefix (so `*engine`
 * and `engine.fuel` are both allowed when the schema nests `engine`).
 */
export function zodAllowedFields(schema: z.ZodTypeAny): string[] {
  const allowed = new Set<string>();
  for (const path of zodQueryResolve(schema).split(",").filter(Boolean)) {
    const parts = path.split(".");
    for (let i = 1; i <= parts.length; i++) {
      allowed.add(parts.slice(0, i).join("."));
    }
  }
  return [...allowed];
}

/** Find-params schema: pagination, `fields`, `q` and top-level filters. */
export function createEntityFindParams(schema: z.ZodTypeAny) {
  return createFindParams().extend({
    q: z.string().optional(),
    ...buildEntityFilters(schema),
  });
}

function unknownEntity(entity: string): MedusaError {
  return new MedusaError(
    MedusaError.Types.NOT_FOUND,
    `Unknown entity "${entity}"`,
  );
}

/**
 * Routes a generic `/:entity` request to the middleware registered for its
 * (snake_case) entity key; any other entity yields a 404.
 */
export function dispatchByEntity(
  middlewares: Record<string, Middleware>,
): Middleware {
  const byKey = new Map(
    Object.entries(mapKeys(middlewares, (_, k) => snakeCase(k))),
  );
  return (req, res, next) => {
    const entity = snakeCase(req.params.entity);
    const middleware = byKey.get(entity);
    if (!middleware) return next(unknownEntity(entity));
    return middleware(req, res, next);
  };
}

/**
 * Query validation for a generic `/:entity` route. Schemas are built once;
 * an entity missing from `schemas` yields a 404.
 */
export function validateAndTransformEntityQuery(
  schemas: Record<string, z.ZodObject>,
  config: QueryConfig<BaseEntity> = {},
): Middleware {
  return dispatchByEntity(
    mapValues(
      schemas,
      (schema) =>
        validateAndTransformQuery(createEntityFindParams(schema), {
          defaults: ["id", "created_at", "updated_at"],
          allowed: zodAllowedFields(schema),
          ...config,
        }) as Middleware,
    ),
  );
}

/**
 * Body validation for a generic `/:entity` route. An entity missing from
 * `schemas` yields a 404.
 */
export function validateAndTransformEntityBody(
  schemas: Record<string, z.ZodType>,
): Middleware {
  return dispatchByEntity(
    mapValues(
      schemas,
      (schema) => validateAndTransformBody(schema) as Middleware,
    ),
  );
}
