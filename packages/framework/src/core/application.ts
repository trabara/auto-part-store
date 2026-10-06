/**
 * Applications: a tenant's Medusa app is a composition of domains (Medusa
 * plugins: a business capability) and the reusable modules they build on.
 *
 * ```ts
 * // apps/backend/medusa-config.ts
 * const app = composeApplication({ domains: [automotiveDomain] })
 * export default defineConfig({ ..., modules: [...core, ...app.modules], plugins: app.plugins })
 * ```
 *
 * A domain lists the module manifests it needs; the application registers
 * each module once, dependencies first, and fails at boot on a missing
 * dependency or a cycle.
 */
import { orderModules, type ModuleManifest } from "./manifest"

export interface DomainManifest {
  /** Domain name, e.g. "automotive". */
  readonly name: string
  /** The domain's Medusa plugin package. */
  readonly resolve: string
  /** Modules the domain builds on (registered by the application). */
  readonly modules: readonly ModuleManifest[]
}

export function defineDomainManifest(manifest: {
  name: string
  resolve: string
  modules?: readonly ModuleManifest[]
}): DomainManifest {
  return Object.freeze({ name: manifest.name, resolve: manifest.resolve, modules: Object.freeze([...(manifest.modules ?? [])]) })
}

export type MedusaRegistration = { resolve: string; options?: Record<string, unknown> }

export interface Application {
  /** Module registrations for `defineConfig({ modules })`, dependencies first. */
  readonly modules: MedusaRegistration[]
  /** Plugin registrations for `defineConfig({ plugins })` (options required there). */
  readonly plugins: Required<MedusaRegistration>[]
  /** Module keys, in registration order. */
  readonly moduleKeys: string[]
}

export function composeApplication(input: {
  domains?: readonly DomainManifest[]
  /** Modules used without a domain (or beyond the domains' needs). */
  modules?: readonly ModuleManifest[]
  /** Options by module key or domain name. */
  options?: Readonly<Record<string, Record<string, unknown>>>
}): Application {
  const domains = input.domains ?? []
  const errors: string[] = []
  const names = new Set<string>()
  for (const d of domains) {
    if (names.has(d.name)) errors.push(`Domain "${d.name}" is declared twice.`)
    names.add(d.name)
  }
  // One registration per module key; the same key must mean the same package.
  const byKey = new Map<string, ModuleManifest>()
  for (const m of [...domains.flatMap((d) => d.modules), ...(input.modules ?? [])]) {
    const known = byKey.get(m.key)
    if (!known) byKey.set(m.key, m)
    else if (known.resolve !== m.resolve) {
      errors.push(`Module "${m.key}" resolves to both ${known.resolve} and ${m.resolve}.`)
    }
  }
  for (const m of byKey.values()) if (!m.resolve) errors.push(`Module "${m.key}" has no \`resolve\` (its package).`)
  if (errors.length) throw new Error(`[application]\n  ${errors.join("\n  ")}`)

  const ordered = orderModules([...byKey.values()])
  const withOptions = (resolve: string, key: string): MedusaRegistration =>
    input.options?.[key] ? { resolve, options: input.options[key] } : { resolve }
  return {
    modules: ordered.map((m) => withOptions(m.resolve!, m.key)),
    plugins: domains.map((d) => ({ resolve: d.resolve, options: input.options?.[d.name] ?? {} })),
    moduleKeys: ordered.map((m) => m.key),
  }
}
