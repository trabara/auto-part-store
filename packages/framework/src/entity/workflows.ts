import { pluralize } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

/**
 * Generic CRUD workflows over any `MedusaService` model, addressed by module
 * key and entity name. Each step compensates its own write, so they compose
 * safely into larger workflows.
 */

export type EntityTarget = {
  /** Container key of the module service (e.g. "automotive"). */
  module: string
  /** Entity / model name as passed to MedusaService (e.g. "VehicleEngine"). */
  entity: string
}

type Row = { id: string } & Record<string, unknown>

export type CreateEntitiesInput = EntityTarget & { data: Record<string, unknown>[] }
export type UpdateEntitiesInput = EntityTarget & { data: Row[] }
export type DeleteEntitiesInput = EntityTarget & { ids: string[] }

function service(container: { resolve: (key: string) => any }, module: string) {
  return container.resolve(module) as Record<string, (...args: any[]) => Promise<any>>
}

function method(op: string, entity: string): string {
  return `${op}${pluralize(entity)}`
}

export const createEntitiesStep = createStep(
  "framework-create-entities",
  async ({ module, entity, data }: CreateEntitiesInput, { container }) => {
    const created: Row[] = await service(container, module)[method("create", entity)]!(data)
    return new StepResponse(created, { module, entity, ids: created.map((r) => r.id) })
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return
    await service(container, undo.module)[method("delete", undo.entity)]!(undo.ids)
  },
)

export const updateEntitiesStep = createStep(
  "framework-update-entities",
  async ({ module, entity, data }: UpdateEntitiesInput, { container }) => {
    const svc = service(container, module)
    const keys = [...new Set(data.flatMap((row) => Object.keys(row)))]
    const previous: Row[] = await svc[method("list", entity)]!(
      { id: data.map((row) => row.id) },
      { select: keys },
    )
    const updated: Row[] = await svc[method("update", entity)]!(data)
    return new StepResponse(updated, { module, entity, previous })
  },
  async (undo, { container }) => {
    if (!undo?.previous.length) return
    await service(container, undo.module)[method("update", undo.entity)]!(undo.previous)
  },
)

export const deleteEntitiesStep = createStep(
  "framework-delete-entities",
  async ({ module, entity, ids }: DeleteEntitiesInput, { container }) => {
    await service(container, module)[method("softDelete", entity)]!(ids)
    return new StepResponse(ids, { module, entity, ids })
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return
    await service(container, undo.module)[method("restore", undo.entity)]!(undo.ids)
  },
)

export const createEntitiesWorkflow = createWorkflow(
  "framework-create-entities",
  (input: CreateEntitiesInput) => new WorkflowResponse(createEntitiesStep(input)),
)

export const updateEntitiesWorkflow = createWorkflow(
  "framework-update-entities",
  (input: UpdateEntitiesInput) => new WorkflowResponse(updateEntitiesStep(input)),
)

/** Soft-deletes (compensated by restore). */
export const deleteEntitiesWorkflow = createWorkflow(
  "framework-delete-entities",
  (input: DeleteEntitiesInput) => new WorkflowResponse(deleteEntitiesStep(input)),
)
