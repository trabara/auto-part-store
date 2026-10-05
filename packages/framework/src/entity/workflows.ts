import { ContainerRegistrationKeys, pluralize } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { snakeCase } from "lodash"
import { getEntity, getEntityModule } from "./define-entity"
import type { RelationDef } from "./types"

/**
 * Generic CRUD workflows over any `MedusaService` model, addressed by module
 * key and entity name. Each step compensates its own write, so they compose
 * safely into larger workflows. For entities declared with `defineEntity`,
 * link relations (`r.link(...)`) are kept in sync: the `${key}_id` fields of
 * the input set Medusa module links instead of columns.
 */

export type EntityTarget = {
  /** Container key of the module service (e.g. "vehicle"). */
  module: string
  /** Entity / model name as passed to MedusaService (e.g. "VehicleEngine"). */
  entity: string
}

type Row = { id: string } & Record<string, unknown>
type Container = { resolve: (key: string) => any }

export type CreateEntitiesInput = EntityTarget & { data: Record<string, unknown>[] }
export type UpdateEntitiesInput = EntityTarget & { data: Row[] }
export type DeleteEntitiesInput = EntityTarget & { ids: string[] }

/** One Medusa link record: `{ [module]: { [linkableKey]: id } }` for both sides. */
type LinkRecord = Record<string, Record<string, string>>

function service(container: Container, module: string) {
  return container.resolve(module) as Record<string, (...args: any[]) => Promise<any>>
}

function method(op: string, entity: string): string {
  return `${op}${pluralize(entity)}`
}

const modelName = (entity: string) => getEntity(entity)?.modelName ?? snakeCase(entity)

type LinkSpec = {
  key: string
  field: string
  targetModule: string
  targetModel: string
}

/** The entity's link relations, with what's needed to build link records. */
function linkSpecs(entity: string): LinkSpec[] {
  const def = getEntity(entity)
  if (!def) return []
  return Object.entries(def.relations as Record<string, RelationDef>)
    .filter(([, rel]) => rel.kind === "link")
    .map(([key, rel]) => {
      const targetModule = getEntityModule(rel.target)
      if (!targetModule) {
        throw new Error(
          `[entity workflows] ${entity}.${key} links to "${rel.target}", which has no module (pass { module } to its defineEntities).`,
        )
      }
      return { key, field: `${key}_id`, targetModule, targetModel: modelName(rel.target) }
    })
}

function linkRecord(target: EntityTarget, id: string, spec: LinkSpec, targetId: string): LinkRecord {
  return {
    [target.module]: { [`${modelName(target.entity)}_id`]: id },
    [spec.targetModule]: { [`${spec.targetModel}_id`]: targetId },
  }
}

/** Splits link fields off a row: `{ columns, links: { field: value } }`. */
function splitRow(row: Record<string, unknown>, specs: LinkSpec[]) {
  const columns = { ...row }
  const links: Record<string, unknown> = {}
  for (const spec of specs) {
    if (spec.field in columns) {
      links[spec.field] = columns[spec.field]
      delete columns[spec.field]
    }
  }
  return { columns, links }
}

const links = (container: Container) => container.resolve(ContainerRegistrationKeys.LINK)

// ── Create ───────────────────────────────────────────────────────────────────

export const createEntitiesStep = createStep(
  "framework-create-entities",
  async (input: CreateEntitiesInput, { container }) => {
    const specs = linkSpecs(input.entity)
    const split = input.data.map((row) => splitRow(row, specs))
    const created: Row[] = await service(container, input.module)[method("create", input.entity)]!(
      split.map((s) => s.columns),
    )

    const records: LinkRecord[] = []
    created.forEach((row, i) => {
      for (const spec of specs) {
        const targetId = split[i]!.links[spec.field]
        if (typeof targetId === "string" && targetId) {
          records.push(linkRecord(input, row.id, spec, targetId))
        }
      }
    })
    if (records.length) await links(container).create(records)

    return new StepResponse(created, {
      module: input.module,
      entity: input.entity,
      ids: created.map((r) => r.id),
      records,
    })
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return
    if (undo.records.length) await links(container).dismiss(undo.records)
    await service(container, undo.module)[method("delete", undo.entity)]!(undo.ids)
  },
)

// ── Update ───────────────────────────────────────────────────────────────────

export const updateEntitiesStep = createStep(
  "framework-update-entities",
  async (input: UpdateEntitiesInput, { container }) => {
    const svc = service(container, input.module)
    const specs = linkSpecs(input.entity)
    const split = input.data.map((row) => splitRow(row, specs))
    const ids = input.data.map((row) => row.id)

    const keys = [...new Set(split.flatMap((s) => Object.keys(s.columns)))]
    const previous: Row[] = await svc[method("list", input.entity)]!({ id: ids }, { select: keys })

    // Current link targets, for the relations this update touches.
    const touched = specs.filter((spec) => split.some((s) => spec.field in s.links))
    const currentTargets = new Map<string, string | null>() // `${id}:${field}` → target id
    if (touched.length) {
      const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
        entity: modelName(input.entity),
        fields: ["id", ...touched.map((spec) => `${spec.key}.id`)],
        filters: { id: ids },
      })
      for (const row of data as Record<string, any>[]) {
        for (const spec of touched) currentTargets.set(`${row.id}:${spec.field}`, row[spec.key]?.id ?? null)
      }
    }

    const updated: Row[] = await svc[method("update", input.entity)]!(
      split.map((s, i) => ({ ...s.columns, id: ids[i] })),
    )

    const dismissed: LinkRecord[] = []
    const created: LinkRecord[] = []
    split.forEach((s, i) => {
      const id = ids[i]!
      for (const spec of touched) {
        if (!(spec.field in s.links)) continue
        const next = (s.links[spec.field] as string | null | undefined) || null
        const current = currentTargets.get(`${id}:${spec.field}`) ?? null
        if (next === current) continue
        if (current) dismissed.push(linkRecord(input, id, spec, current))
        if (next) created.push(linkRecord(input, id, spec, next))
      }
    })
    if (dismissed.length) await links(container).dismiss(dismissed)
    if (created.length) await links(container).create(created)

    return new StepResponse(updated, {
      module: input.module,
      entity: input.entity,
      previous,
      dismissed,
      created,
    })
  },
  async (undo, { container }) => {
    if (!undo) return
    if (undo.created.length) await links(container).dismiss(undo.created)
    if (undo.dismissed.length) await links(container).create(undo.dismissed)
    if (undo.previous.length) {
      await service(container, undo.module)[method("update", undo.entity)]!(undo.previous)
    }
  },
)

// ── Delete ───────────────────────────────────────────────────────────────────

export const deleteEntitiesStep = createStep(
  "framework-delete-entities",
  async ({ module, entity, ids }: DeleteEntitiesInput, { container }) => {
    await service(container, module)[method("softDelete", entity)]!(ids)
    // Soft-delete every link of these records (either side of the link).
    const removed = { [module]: { [`${modelName(entity)}_id`]: ids } }
    await links(container).delete(removed)
    return new StepResponse(ids, { module, entity, ids, removed })
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return
    await service(container, undo.module)[method("restore", undo.entity)]!(undo.ids)
    await links(container).restore(undo.removed)
  },
)

// ── Workflows ────────────────────────────────────────────────────────────────

export const createEntitiesWorkflow = createWorkflow(
  "framework-create-entities",
  (input: CreateEntitiesInput) => new WorkflowResponse(createEntitiesStep(input)),
)

export const updateEntitiesWorkflow = createWorkflow(
  "framework-update-entities",
  (input: UpdateEntitiesInput) => new WorkflowResponse(updateEntitiesStep(input)),
)

/** Soft-deletes (compensated by restore), including the records' module links. */
export const deleteEntitiesWorkflow = createWorkflow(
  "framework-delete-entities",
  (input: DeleteEntitiesInput) => new WorkflowResponse(deleteEntitiesStep(input)),
)
