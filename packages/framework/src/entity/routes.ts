import type {
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { snakeCase } from "lodash"
import { validateEntityBody, validateEntityQuery } from "./http"
import type { EntityDef } from "./types"
import {
  createEntitiesWorkflow,
  deleteEntitiesWorkflow,
  updateEntitiesWorkflow,
} from "./workflows"

type AnyEntity = EntityDef<any, any, any>
type Handler = (req: MedusaRequest<any>, res: MedusaResponse) => Promise<void>

export type EntityRoutesOptions = {
  /** Container key of the module service owning the entities. */
  module: string
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

  const target = (entity: AnyEntity) => ({ module, entity: entity.name as string })

  const collection = {
    async GET(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data, metadata } = await query.graph({
        entity: entity.modelName,
        ...req.queryConfig,
        filters: req.filterableFields,
      })
      res.status(200).json({ entity: entity.modelName, data, metadata })
    },

    async POST(req: MedusaRequest, res: MedusaResponse) {
      const entity = resolve(req)
      const { result } = await createEntitiesWorkflow(req.scope).run({
        input: { ...target(entity), data: [req.validatedBody as Record<string, unknown>] },
      })
      res.status(201).json({ entity: entity.modelName, data: result[0] })
    },

    async PUT(req: MedusaRequest<{ entities: { id: string }[] }>, res: MedusaResponse) {
      const entity = resolve(req)
      const { result } = await updateEntitiesWorkflow(req.scope).run({
        input: { ...target(entity), data: req.validatedBody.entities },
      })
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
      const { result } = await updateEntitiesWorkflow(req.scope).run({
        input: {
          ...target(entity),
          data: [{ ...(req.validatedBody as Record<string, unknown>), id: req.params.id }],
        },
      })
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
