/**
 * Entity write hooks: code that must run with a write, inside the same
 * compensating workflow step (e.g. keep a Medusa record in sync). Registered
 * per entity by server code (a module's index), run by the framework's
 * create / update / delete steps after (or, for `deleting`, before) the write.
 * A hook returns data its `compensate` gets back if the workflow rolls back.
 */

type Container = { resolve: <T = any>(key: string) => T }
type Row = { id: string } & Record<string, any>

export interface HookContext {
  container: Container
  /** Module key and entity name of the write. */
  module: string
  entity: string
}

export interface Hook<I> {
  run: (input: I, ctx: HookContext) => Promise<unknown>
  compensate?: (data: any, ctx: HookContext) => Promise<void>
}

export interface EntityHooks {
  /** After rows are created (and their links synced). */
  created?: Hook<{ records: Row[] }>
  /** After rows are updated; `previous` holds the changed fields' old values. */
  updated?: Hook<{ records: Row[]; previous: Row[] }>
  /** Before rows are deleted: throw (e.g. MedusaError NOT_ALLOWED) to refuse. */
  deleting?: (input: { ids: string[] }, ctx: HookContext) => Promise<void>
  /** After rows are soft-deleted. */
  deleted?: Hook<{ ids: string[] }>
}

type Phase = "created" | "updated" | "deleted"

const registry = new Map<string, EntityHooks[]>()

/** Registers write hooks for an entity (several registrations run in order). */
export function onEntity(entity: string, hooks: EntityHooks): void {
  registry.set(entity, [...(registry.get(entity) ?? []), hooks])
}

/** @internal Clears hooks (tests). */
export function resetEntityHooks(): void {
  registry.clear()
}

/** @internal Runs `deleting` checks. */
export async function runDeletingHooks(ctx: HookContext, ids: string[]): Promise<void> {
  for (const hooks of registry.get(ctx.entity) ?? []) await hooks.deleting?.({ ids }, ctx)
}

/** Compensation data for the hooks that ran: index into the registry + data. */
export type HookUndo = { index: number; data: unknown }[]

/** @internal Runs one phase's hooks; returns what their compensations need. */
export async function runHooks<P extends Phase>(
  phase: P,
  ctx: HookContext,
  input: Parameters<NonNullable<EntityHooks[P]>["run"]>[0],
): Promise<HookUndo> {
  const undo: HookUndo = []
  const list = registry.get(ctx.entity) ?? []
  for (let index = 0; index < list.length; index++) {
    const hook = list[index]![phase] as Hook<any> | undefined
    if (!hook) continue
    try {
      undo.push({ index, data: await hook.run(input, ctx) })
    } catch (error) {
      await compensateHooks(phase, ctx, undo)
      throw error
    }
  }
  return undo
}

/** @internal Undoes the hooks that ran, last first. */
export async function compensateHooks(phase: Phase, ctx: HookContext, undo: HookUndo): Promise<void> {
  const list = registry.get(ctx.entity) ?? []
  for (const { index, data } of [...undo].reverse()) {
    const hook = list[index]?.[phase] as Hook<any> | undefined
    await hook?.compensate?.(data, ctx)
  }
}
