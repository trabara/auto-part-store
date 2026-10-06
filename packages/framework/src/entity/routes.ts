import type {
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { snakeCase } from "lodash"
import { getEntityModule } from "./define-entity"
import { withReadableErrors } from "./errors"
import { searchFilter } from "./search"
import { validateEntityBody, validateEntityQuery } from "./http"
import type { EntityDef } from "./types"
import {
  createEntitiesWorkflow,
  deleteEntitiesWorkflow,
  updateEntitiesWorkflow,
} from "./workflows"

type AnyEntity = EntityDef<any, any, any>

/**
 * Filters on single-source derived fields go through the same `compute` as
 * the stored value ("04465 02220" → "0446502220"); `$ilike` keeps its `%`.
 */
export function normalizeDerivedFilters(
  entity: AnyEntity,
  filters: Record<string, unknown> = {},
): Record<string, unknown> {
  const out = { ...filters }
  for (const [field, def] of Object.entries(entity.derived ?? {})) {
    if (def.from.length !== 1 || !(field in out)) continue
    const normalize = (value: unknown) =>
      typeof value === "string" ? def.compute({ [def.from[0]!]: value }) : value
    const value = out[field]
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[field] = Object.fromEntries(
        Object.entries(value).map(([op, v]) => {
          if (op === "$ilike" || op === "$like") {
            const m = typeof v === "string" ? v.match(/^(%?)(.*?)(%?)$/s) : null
            return [op, m ? `${m[1]}${normalize(m[2])}${m[3]}` : v]
          }
          return [op, Array.isArray(v) ? v.map(normalize) : normalize(v)]
        }),
      )
    } else {
      out[field] = Array.isArray(value) ? value.map(normalize) : normalize(value)
    }
  }
  return out
}
type Handler = (req: MedusaRequest<any>, res: MedusaResponse) => Promise<void>

export type EntityRoutesOptions = {
  /**
   * Module service key for entities that have none recorded. Entities grouped
   * with `defineEntities(…, { module })` use their own module, so one API can
   * serve entities from several modules.
   */
  module?: string
  /** Entities reachable through the routes (the allowlist). */
  entities: readonly AnyEntity[]
  /** Relation depth allowed in `?fields=` (default 2). */
  depth?: number
}

export interface EntityRoutes {
  /** The exposed entities (the allowlist). */
  readonly entities: readonly AnyEntity[]
  /** Middlewares for `${basePath}/:entity` and `${basePath}/:entity/:id`. */
  middlewares(basePath: string): MiddlewareRoute[]
  /** Handlers for `[entity]/route.ts`. */
  readonly collection: { GET: Handler; POST: Handler; PUT: Handler }
  /** Handlers for `[entity]/[id]/route.ts`. */
  readonly item: { GET: Handler; PUT: Handler; DELETE: Handler }
}

/**
 * Generic CRUD API over a module's entities: validation from each entity's
 * derived schemas, reads through remote query, writes through compensating
 * workflows. Entities outside `entities` are a 404.
 *
 * ```ts
 * // api/admin/automotive/[entity]/route.ts
 * export const { GET, POST, PUT } = automotiveRoutes.collection
 * ```
 */
export function createEntityRoutes({ module, entities, depth }: EntityRoutesOptions): EntityRoutes {
  const byKey = new Map(entities.map((entity) => [entity.modelName as string, entity]))

  const resolve = (req: MedusaRequest): AnyEntity => {
    const key = snakeCase(req.params.entity)
    const entity = byKey.get(key)
    if (!entity) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown entity "${key}"`)
    }
    return entity
  }

  const target = (entity: AnyEntity) => {
    const entityModule = getEntityModule(entity.name) ?? module
    if (!entityModule) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `${entity.name} has no module: pass { module } to its defineEntities or to createEntityRoutes.`,
      )
    }
    return { module: entityModule, entity: entity.name as string }
  }

  const collection = {
    async GET(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { q, ...filterable } = (req.filterableFields ?? {}) as Record<string, unknown>
      const filters = normalizeDerivedFilters(entity, filterable)
      const search = searchFilter(entity, typeof q === "string" ? q : undefined)
      const { data, metadata } = await query.graph({
        entity: entity.modelName,
        ...req.queryConfig,
        filters: search ? { $and: [filters, search] } : filters,
      })
      res.status(200).json({ entity: entity.modelName, data, metadata })
    },

    async POST(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const { result } = await withReadableErrors(entity, () =>
        createEntitiesWorkflow(req.scope).run({
          input: { ...target(entity), data: [req.validatedBody as Record<string, unknown>] },
        }),
      )
      res.status(201).json({ entity: entity.modelName, data: result[0] })
    },

    async PUT(req: MedusaRequest<{ entities: { id: string }[] }>, res: MedusaResponse) {
      const entity = resolve(req)
      const { result } = await withReadableErrors(entity, () =>
        updateEntitiesWorkflow(req.scope).run({
          input: { ...target(entity), data: req.validatedBody.entities },
        }),
      )
      res.status(200).json({ entity: entity.modelName, updates: result })
    },
  }

  const item = {
    async GET(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const { id } = req.params
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: entity.modelName,
        ...req.queryConfig,
        filters: { id },
      })
      if (!data?.length) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `${entity.modelName} with id "${id}" not found`,
        )
      }
      res.status(200).json({ entity: entity.modelName, data: data[0] })
    },

    async PUT(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const { result } = await withReadableErrors(entity, () =>
        updateEntitiesWorkflow(req.scope).run({
          input: {
            ...target(entity),
            data: [{ ...(req.validatedBody as Record<string, unknown>), id: req.params.id }],
          },
        }),
      )
      res.status(200).json({ entity: entity.modelName, data: result[0] })
    },

    async DELETE(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const { id } = req.params
      await deleteEntitiesWorkflow(req.scope).run({ input: { ...target(entity), ids: [id] } })
      res.status(200).json({ id, object: entity.modelName, deleted: true })
    },
  }

  return {
    entities,
    middlewares(basePath) {
      const base = basePath.replace(/\/$/, "")
      return [
        {
          matcher: `${base}/:entity`,
          methods: ["GET"],
          middlewares: [validateEntityQuery(entities, { isList: true, depth })],
        },
        {
          matcher: `${base}/:entity/:id`,
          methods: ["GET"],
          middlewares: [validateEntityQuery(entities, { depth })],
        },
        {
          matcher: `${base}/:entity`,
          methods: ["POST"],
          middlewares: [validateEntityBody(entities, "create")],
        },
        {
          matcher: `${base}/:entity`,
          methods: ["PUT"],
          middlewares: [validateEntityBody(entities, "batchUpdate")],
        },
        {
          matcher: `${base}/:entity/:id`,
          methods: ["PUT"],
          middlewares: [validateEntityBody(entities, "update")],
        },
      ]
    },
    collection,
    item,
  }
}
