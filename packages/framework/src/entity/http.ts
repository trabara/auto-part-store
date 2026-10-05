import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import type { BaseEntity, QueryConfig } from "@medusajs/framework/types"
import { dispatchByEntity, type Middleware } from "../http/helpers"
import type { EntityDef } from "./types"

type AnyEntity = EntityDef<any, any, any>

/**
 * Query validation for a generic `/:entity` route over the given entities
 * (the allowlist): find params, filters and `allowed` fields come from each
 * entity; any other `:entity` yields a 404.
 */
export function validateEntityQuery(
  entities: readonly AnyEntity[],
  config: QueryConfig<BaseEntity> & { depth?: number } = {},
): Middleware {
  const { depth, ...queryConfig } = config
  return dispatchByEntity(
    Object.fromEntries(
      entities.map((entity) => [
        entity.modelName,
        validateAndTransformQuery(entity.query.findParams, {
          defaults: ["id", "created_at", "updated_at"],
          allowed: entity.query.allowed(depth),
          ...queryConfig,
        }) as Middleware,
      ]),
    ),
  )
}

/**
 * Body validation for a generic `/:entity` route with one of each entity's
 * derived DTOs; any other `:entity` yields a 404.
 */
export function validateEntityBody(
  entities: readonly AnyEntity[],
  dto: keyof AnyEntity["dto"],
): Middleware {
  return dispatchByEntity(
    Object.fromEntries(
      entities.map((entity) => [
        entity.modelName,
        validateAndTransformBody(entity.dto[dto]) as Middleware,
      ]),
    ),
  )
}
