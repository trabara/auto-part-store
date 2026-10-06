import { ContainerRegistrationKeys, pluralize } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { snakeCase } from "lodash"
import { getEntity, getEntityModule, withDerived } from "./define-entity"
import { compensateHooks, runDeletingHooks, runHooks, type HookUndo } from "./hooks"
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

/** Fills derived fields on a row to write (definitions from `defineEntity`). */
function derive(entity: string, row: Record<string, unknown>): Record<string, unknown> {
  const def = getEntity(entity)
  return def ? withDerived(def, row) : row
}

/** Source fields of the entity's derived fields. */
function derivedSources(entity: string): string[] {
  const derived = getEntity(entity)?.derived ?? {}
  return [...new Set(Object.values(derived).flatMap((d) => [...d.from]))]
}

const hookContext = (container: Container, target: EntityTarget) => ({
  container: container as any,
  module: target.module,
  entity: target.entity,
})

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
    // Column-stored links are plain columns: nothing to sync.
    .filter(([, rel]) => rel.kind === "link" && rel.options.storage !== "column")
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

const recordKey = (record: LinkRecord) =>
  JSON.stringify(Object.keys(record).sort().map((k) => [k, record[k]]))

/** Live (not soft-deleted) link records of `ids` for the entity's link relations. */
async function liveLinks(
  container: Container,
  target: EntityTarget,
  ids: string[],
  specs: LinkSpec[],
): Promise<LinkRecord[]> {
  if (!specs.length || !ids.length) return []
  const own = `${modelName(target.entity)}_id`
  return links(container).list(
    specs.map((spec) => ({
      [target.module]: { [own]: ids },
      [spec.targetModule]: { [`${spec.targetModel}_id`]: { $ne: null } },
    })),
    { asLinkDefinition: true },
  )
}

// ── Create ───────────────────────────────────────────────────────────────────

export const createEntitiesStep = createStep(
  "framework-create-entities",
  async (input: CreateEntitiesInput, { container }) => {
    const specs = linkSpecs(input.entity)
    const split = input.data.map((row) => splitRow(row, specs))
    const created: Row[] = await service(container, input.module)[method("create", input.entity)]!(
      split.map((s) => derive(input.entity, s.columns)),
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

    let hooks: HookUndo = []
    try {
      hooks = await runHooks("created", hookContext(container, input), { records: created })
    } catch (error) {
      if (records.length) await links(container).dismiss(records)
      await service(container, input.module)[method("delete", input.entity)]!(created.map((r) => r.id))
      throw error
    }

    return new StepResponse(created, {
      module: input.module,
      entity: input.entity,
      ids: created.map((r) => r.id),
      records,
      hooks,
    })
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return
    await compensateHooks("created", hookContext(container, undo), undo.hooks)
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
    // Derived fields are recomputed from the merged row when a source changes.
    const sources = derivedSources(input.entity)
    const derivedChange = sources.some((source) => keys.includes(source))
    const derivedKeys = derivedChange ? Object.keys(getEntity(input.entity)?.derived ?? {}) : []
    const previous: Row[] = await svc[method("list", input.entity)]!(
      { id: ids },
      { select: [...new Set(["id", ...keys, ...(derivedChange ? sources : []), ...derivedKeys])] },
    )
    const previousById = new Map(previous.map((row) => [row.id, row]))

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
      split.map((s, i) => {
        const row = { ...s.columns, id: ids[i] }
        if (!derivedChange) return row
        const merged = derive(input.entity, { ...previousById.get(ids[i]!), ...row })
        return { ...row, ...Object.fromEntries(derivedKeys.map((k) => [k, merged[k]])) }
      }),
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

    const undoWrite = async () => {
      if (created.length) await links(container).dismiss(created)
      if (dismissed.length) await links(container).create(dismissed)
      if (previous.length) await svc[method("update", input.entity)]!(previous)
    }
    let hooks: HookUndo = []
    try {
      hooks = await runHooks("updated", hookContext(container, input), { records: updated, previous })
    } catch (error) {
      await undoWrite()
      throw error
    }

    return new StepResponse(updated, {
      module: input.module,
      entity: input.entity,
      previous,
      dismissed,
      created,
      hooks,
    })
  },
  async (undo, { container }) => {
    if (!undo) return
    await compensateHooks("updated", hookContext(container, undo), undo.hooks)
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
  async (input: DeleteEntitiesInput, { container }) => {
    const { module, entity, ids } = input
    const specs = linkSpecs(entity)
    // Dismissed links are soft-deleted too, so restoring by id would revive
    // them; remember which links were live to undo exactly this delete.
    await runDeletingHooks(hookContext(container, input), ids)
    const live = await liveLinks(container, input, ids, specs)
    await service(container, module)[method("softDelete", entity)]!(ids)
    // Soft-delete every link of these records (either side of the link).
    const removed = { [module]: { [`${modelName(entity)}_id`]: ids } }
    await links(container).delete(removed)
    let hooks: HookUndo = []
    try {
      hooks = await runHooks("deleted", hookContext(container, input), { ids })
    } catch (error) {
      await service(container, module)[method("restore", entity)]!(ids)
      await links(container).restore(removed)
      throw error
    }
    return new StepResponse(ids, { module, entity, ids, removed, live: live.map(recordKey), hooks })
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return
    await compensateHooks("deleted", hookContext(container, undo), undo.hooks)
    await service(container, undo.module)[method("restore", undo.entity)]!(undo.ids)
    await links(container).restore(undo.removed)
    const wasLive = new Set(undo.live)
    const revived = await liveLinks(container, undo, undo.ids, linkSpecs(undo.entity))
    const stale = revived.filter((record) => !wasLive.has(recordKey(record)))
    if (stale.length) await links(container).dismiss(stale)
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
