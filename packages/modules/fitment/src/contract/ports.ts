// What the fitment module needs its domain to provide, and the sockets the
// domain plugs it into at startup (server: a workflow hook; admin: a setup
// file). Entities (AutomotiveAttribute) and core rules read through them.
import type { ConditionAttribute } from "./conditions";

/** Supplies the attributes conditions may test; registered by the domain. */
export type ConditionAttributeProvider = () => readonly ConditionAttribute[];

/**
 * Admin translation resources (`toAdminI18n(...)` of the domain: this
 * module's messages and the catalog's labels): stored summaries are written
 * in every locale.
 */
export type ConditionTranslations = Partial<Record<string, { translation: Record<string, any> }>>;

let provider: ConditionAttributeProvider = () => [];
let cache: { list: readonly ConditionAttribute[]; byCode: Map<string, ConditionAttribute> } | null = null;

/**
 * Registers the catalog conditions test (server and admin each call it at
 * startup, from the domain). The last registration wins.
 */
export function provideConditionAttributes(next: ConditionAttributeProvider | readonly ConditionAttribute[]): void {
  provider = typeof next === "function" ? next : () => next;
  cache = null;
}

function catalog() {
  if (!cache) {
    const list = provider();
    cache = { list, byCode: new Map(list.map((a) => [a.code, a])) };
  }
  return cache;
}

/** The registered attributes (empty until the domain provides them). */
export const conditionAttributes = (): readonly ConditionAttribute[] => catalog().list;

export const conditionAttribute = (code: string): ConditionAttribute | undefined => catalog().byCode.get(code);

let translations: ConditionTranslations = {};

/**
 * Registers the translation resources stored summaries are written with
 * (every locale). The last registration wins.
 */
export function provideConditionTranslations(next: ConditionTranslations): void {
  translations = next;
}

export const conditionTranslations = (): ConditionTranslations => translations;
