import { MedusaError } from "@medusajs/framework/utils"
import type { EntityDef } from "./types"

type AnyEntity = EntityDef<any, any, any>

// Medusa's dbErrorMapper: "<Table> with <col>: <value>, …, already exists."
const UNIQUE_VIOLATION = /^.+ with (.+), already exists\.$/s

const words = (s: string) => s.replace(/_id$/, "").replace(/[_\s]+/g, " ").trim()

const article = (noun: string) => (/^[aeiou]/i.test(noun) ? "An" : "A")

/**
 * Columns named in a unique-violation message. Expression indexes report
 * their expression (`lower(name::text)`), reduced here to the column.
 * Medusa's parser keeps only the innermost parentheses of the detail, so a
 * composite expression index (`make_id, lower(name)`) reports just `name`:
 * key such messages on the columns actually reported.
 */
function violatedColumns(entity: AnyEntity, detail: string): string[] {
  const columns = new Set<string>(entity.query.fields)
  const found: string[] = []
  for (const part of detail.split(/, (?=[^,]*: )/)) {
    const key = part.slice(0, part.indexOf(": "))
    const column = key.match(/([a-z_][a-z0-9_]*)(?:::\w+)?\)*$/i)?.[1] ?? key
    if (columns.has(column) && !found.includes(column)) found.push(column)
  }
  return found
}

/**
 * The readable message for a unique violation of `entity`, or undefined when
 * `error` is something else. Uses the entity's `messages.unique` entry for
 * the violated columns, else "A vehicle model with this make and name
 * already exists."
 */
export function uniqueViolationMessage(entity: AnyEntity, error: unknown): string | undefined {
  const message = (error as { message?: unknown })?.message
  if (typeof message !== "string") return undefined
  const match = message.match(UNIQUE_VIOLATION)
  if (!match) return undefined

  const columns = violatedColumns(entity, match[1]!)
  const same = (on: readonly string[]) =>
    on.length === columns.length && on.every((column) => columns.includes(column))
  const custom = entity.messages.unique.find((m) => same(m.on))
  if (custom) return custom.message

  const noun = words(entity.modelName)
  const names = columns.map(words)
  const what = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] ?? "values"
  return `${article(noun)} ${noun} with this ${what} already exists.`
}

/** Runs a write; unique violations are rethrown with the readable message. */
export async function withReadableErrors<T>(entity: AnyEntity, write: () => Promise<T>): Promise<T> {
  try {
    return await write()
  } catch (error) {
    const message = uniqueViolationMessage(entity, error)
    if (message) throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
    throw error
  }
}
