// The maintenance ledger's rules: which tasks the catalog needs (research its
// gaps, verify records when their tier's interval is up), how valuable each
// is, and when a task may run again after its last outcome. Pure.
import { CatalogEntityName, CatalogTaskKind, CatalogTaskStatus } from "../../contract/entities/enums";
import { childrenOf } from "./export";
import { generationKey, modelKey } from "./keys";
import { verifyDue } from "./trust";

type Provenance = { source_tier?: string | null; verified_at?: Date | string | null };

/** What the ledger reads to know what the catalog needs. */
export type LedgerRecords = {
  makes: { id: string; name: string }[];
  models: ({ id: string; make_id: string; name: string; category: string; on_sale_new?: boolean | null } & Provenance)[];
  generations: ({ id: string; model_id: string; name: string; code: string | null; year_start: number; year_end: number | null } & Provenance)[];
  vehicles: ({ id: string; generation_id: string; engine_id: string } & Provenance)[];
  engines: ({ id: string } & Provenance)[];
};

/** A task the catalog needs now. */
export type TaskCandidate = {
  kind: CatalogTaskKind;
  key: string;
  entity: CatalogEntityName;
  record_id: string;
  make: string;
  model: string;
  generation: string | null;
  priority: number;
};

const BASE: Record<CatalogTaskKind, number> = {
  [CatalogTaskKind.RESEARCH_GENERATIONS]: 100,
  [CatalogTaskKind.RESEARCH_CONFIGURATIONS]: 80,
  [CatalogTaskKind.VERIFY_MODEL]: 60,
  [CatalogTaskKind.VERIFY_GENERATION]: 60,
  [CatalogTaskKind.CLEANUP]: 0,
};

/** Recent generations matter most (the park that needs parts): ongoing, then by end year. */
export const recencyBonus = (g: { year_end: number | null } | undefined) =>
  !g ? 0 : g.year_end == null ? 30 : g.year_end >= 2015 ? 20 : g.year_end >= 2005 ? 10 : 0;

const DAY = 86_400_000;
const earliest = (dates: (Date | null)[]) =>
  dates.reduce<Date | null>((min, d) => (d && (!min || d < min) ? d : min), null);

/**
 * The tasks the catalog needs at `now`, with their priority:
 * - research: models without generations, generations with at most
 *   `maxConfigurations` configurations;
 * - verification: a model unit (the model and its generations) or a
 *   generation unit (its configurations and their engines) as soon as one of
 *   its records is due (tier interval since it was last verified).
 */
export function taskCandidates(records: LedgerRecords, options: { now?: Date; maxConfigurations?: number } = {}): TaskCandidate[] {
  const now = options.now ?? new Date();
  const max = options.maxConfigurations ?? 0;
  const makeName = new Map(records.makes.map((m) => [m.id, m.name]));
  const generationsOf = childrenOf(records.generations, "model_id");
  const vehiclesOf = childrenOf(records.vehicles, "generation_id");
  const engineById = new Map(records.engines.map((e) => [e.id, e]));
  const candidates: TaskCandidate[] = [];
  const overdue = (due: Date | null) => (due ? Math.min(40, Math.floor((now.getTime() - due.getTime()) / DAY / 30)) : 0);

  for (const model of records.models) {
    const make = makeName.get(model.make_id) ?? "";
    const base = { make, model: model.name };
    const onSale = model.on_sale_new ? 50 : 0;
    const gens = generationsOf(model.id);
    if (!gens.length) {
      candidates.push({
        kind: CatalogTaskKind.RESEARCH_GENERATIONS,
        key: modelKey(make, model.name),
        entity: CatalogEntityName.VehicleModel,
        record_id: model.id,
        ...base,
        generation: null,
        priority: BASE[CatalogTaskKind.RESEARCH_GENERATIONS] + onSale,
      });
      continue;
    }
    const latest = [...gens].sort((a, b) => (b.year_end ?? Infinity) - (a.year_end ?? Infinity))[0];
    const modelDue = earliest([verifyDue(model.source_tier, model.verified_at, now), ...gens.map((g) => verifyDue(g.source_tier, g.verified_at, now))]);
    if (modelDue && modelDue <= now) {
      candidates.push({
        kind: CatalogTaskKind.VERIFY_MODEL,
        key: modelKey(make, model.name),
        entity: CatalogEntityName.VehicleModel,
        record_id: model.id,
        ...base,
        generation: null,
        priority: BASE[CatalogTaskKind.VERIFY_MODEL] + overdue(modelDue) + onSale + recencyBonus(latest),
      });
    }
    for (const g of gens) {
      const vehicles = vehiclesOf(g.id);
      const unit = { ...base, generation: g.name, entity: CatalogEntityName.VehicleGeneration, record_id: g.id, key: generationKey(make, model.name, g.name) };
      if (vehicles.length <= max) {
        candidates.push({
          kind: CatalogTaskKind.RESEARCH_CONFIGURATIONS,
          ...unit,
          priority: BASE[CatalogTaskKind.RESEARCH_CONFIGURATIONS] + onSale + recencyBonus(g),
        });
        continue;
      }
      const engines = [...new Set(vehicles.map((v) => v.engine_id))].map((id) => engineById.get(id)).filter((e) => !!e);
      const due = earliest([
        ...vehicles.map((v) => verifyDue(v.source_tier, v.verified_at, now)),
        ...engines.map((e) => verifyDue(e!.source_tier, e!.verified_at, now)),
      ]);
      if (due && due <= now) {
        candidates.push({
          kind: CatalogTaskKind.VERIFY_GENERATION,
          ...unit,
          priority: BASE[CatalogTaskKind.VERIFY_GENERATION] + overdue(due) + onSale + recencyBonus(g),
        });
      }
    }
  }
  return candidates.sort((a, b) => b.priority - a.priority);
}

/** Failed attempts lower a task's priority (others go first). */
export const effectivePriority = (priority: number, failures: number) => priority - 10 * failures;

/**
 * When a task may run again after an outcome: FAILED waits 2^attempts days
 * (at most 60), NO_DATA 90 days, APPLIED 30 days (if the gap is still there),
 * REVIEW and DONE wait for a person or for the catalog to need it again.
 */
export function nextRun(status: CatalogTaskStatus, attempts: number, now = new Date()): Date | null {
  const days =
    status === CatalogTaskStatus.FAILED
      ? Math.min(60, 2 ** Math.max(0, attempts))
      : status === CatalogTaskStatus.NO_DATA
        ? 90
        : status === CatalogTaskStatus.APPLIED
          ? 30
          : null;
  return days == null ? null : new Date(now.getTime() + days * DAY);
}

/** A task a worker may claim at `now`. */
export function claimable(
  task: { status: string; next_run_at?: Date | string | null; lease_until?: Date | string | null },
  now = new Date(),
): boolean {
  const at = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : 0);
  switch (task.status) {
    case CatalogTaskStatus.PENDING:
      return at(task.next_run_at) <= now.getTime();
    case CatalogTaskStatus.RUNNING:
      return at(task.lease_until) < now.getTime(); // the worker died: lease expired
    case CatalogTaskStatus.APPLIED:
    case CatalogTaskStatus.NO_DATA:
    case CatalogTaskStatus.FAILED:
      return at(task.next_run_at) <= now.getTime();
    default:
      return false; // REVIEW waits for a person; DONE is closed
  }
}
