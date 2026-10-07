/**
 * Module manifests: what a reusable module is (its Medusa key) and which
 * modules it depends on. A module may import only a declared dependency's
 * contract (`@repo/module-<dep>/contract`, enforced by `yarn check-layers`); the application
 * composes modules and domains and checks the dependencies.
 *
 * ```ts
 * // modules/fitment/manifest.ts — `dependsOn` is read by the layer check:
 * // keep it a literal array of module keys.
 * export const fitmentManifest = defineModuleManifest({
 *   key: "fitment",
 *   dependsOn: ["vehicle"],
 *   resolve: "@repo/module-fitment",
 * })
 * ```
 */

export interface ModuleManifest {
  /** Medusa module key (the service's container key). */
  readonly key: string
  /** Keys of the modules this one builds on (link targets, shared entities). */
  readonly dependsOn: readonly string[]
  /** What the application registers with Medusa (the module's package). */
  readonly resolve?: string
}

export function defineModuleManifest(manifest: {
  key: string
  dependsOn?: readonly string[]
  resolve?: string
}): ModuleManifest {
  return Object.freeze({
    key: manifest.key,
    dependsOn: Object.freeze([...(manifest.dependsOn ?? [])]),
    ...(manifest.resolve ? { resolve: manifest.resolve } : {}),
  })
}

/** Problems in a set of manifests: duplicate keys, unknown dependencies, cycles. */
export function validateModuleManifests(manifests: readonly ModuleManifest[]): string[] {
  const errors: string[] = []
  const byKey = new Map<string, ModuleManifest>()
  for (const m of manifests) {
    if (byKey.has(m.key)) errors.push(`Module "${m.key}" is declared twice.`)
    byKey.set(m.key, m)
  }
  for (const m of manifests) {
    for (const dep of m.dependsOn) {
      if (dep === m.key) errors.push(`Module "${m.key}" depends on itself.`)
      else if (!byKey.has(dep)) errors.push(`Module "${m.key}" depends on "${dep}", which is not registered.`)
    }
  }
  // Cycles (depth-first; reported once per cycle start).
  const state = new Map<string, "visiting" | "done">()
  const visit = (key: string, path: string[]) => {
    if (state.get(key) === "done") return
    if (state.get(key) === "visiting") {
      errors.push(`Module dependency cycle: ${[...path.slice(path.indexOf(key)), key].join(" → ")}.`)
      return
    }
    state.set(key, "visiting")
    for (const dep of byKey.get(key)?.dependsOn ?? []) if (byKey.has(dep) && dep !== key) visit(dep, [...path, key])
    state.set(key, "done")
  }
  for (const m of manifests) visit(m.key, [])
  return errors
}

/** Manifests ordered so every module comes after its dependencies. Throws when invalid. */
export function orderModules(manifests: readonly ModuleManifest[]): ModuleManifest[] {
  const errors = validateModuleManifests(manifests)
  if (errors.length) throw new Error(`[modules]\n  ${errors.join("\n  ")}`)
  const byKey = new Map(manifests.map((m) => [m.key, m]))
  const ordered: ModuleManifest[] = []
  const seen = new Set<string>()
  const add = (m: ModuleManifest) => {
    if (seen.has(m.key)) return
    seen.add(m.key)
    m.dependsOn.forEach((dep) => add(byKey.get(dep)!))
    ordered.push(m)
  }
  manifests.forEach(add)
  return ordered
}
