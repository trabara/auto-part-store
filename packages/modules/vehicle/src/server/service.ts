import type { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";
import { entityLabel, withDerived, type EntityDef } from "@repo/framework/entity";
import {
  Vehicle,
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleReference,
  CatalogEntityName,
  CatalogTaskKind,
  CatalogTaskStatus,
  SourceTier,
  type SourceRef,
  type CatalogFile,
  type CatalogImportMode,
  type CatalogImportReport,
} from "../contract";
import {
  agentDraftFile,
  catalogCoverage,
  planCatalog,
  recordsToCatalog,
  researchTasks,
  toCatalogVehicle,
  validateCatalog,
  type CatalogRecords,
  type CatalogRef,
  type CatalogSnapshot,
  type CatalogRecordEntity,
  type CatalogTouch,
  type ModelCoverage,
  type ResearchTask,
  type Correction,
  type Finding,
  type FindingFix,
  type LedgerRecords,
  type LintRecords,
  type StewardContext,
  type StewardGeneration,
  type VerificationOutcome,
  effectivePriority,
  higherTier,
  lintCatalog,
  mergeSources,
  nextRun,
  parseOutput,
  researchFile,
  taskCandidates,
  verificationOutcome,
} from "../core";
import { vehicleModels } from "./models/vehicle";

type Range = { year_start: number; year_end: number | null };
type Row = Record<string, any>;

/** `inner`'s years fall within `outer`'s (open-ended `outer` accepts any end). */
const inside = (inner: Range, outer: Range) =>
  inner.year_start >= outer.year_start &&
  (outer.year_end == null || (inner.year_end != null && inner.year_end <= outer.year_end));

/** Produced in `year` (any year when not given). */
const covers = (r: Range, year?: number) =>
  year == null || (r.year_start <= year && (r.year_end == null || r.year_end >= year));

/** Relations to load for dotted label fields: `generation.model.name` → generation, generation.model. */
const relationsOf = (fields: readonly string[], prefix = "") => {
  const paths = new Set<string>();
  for (const field of fields) {
    const parts = `${prefix}${field}`.split(".").slice(0, -1);
    parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join(".")));
  }
  return [...paths];
};

const VEHICLE_RELATIONS = relationsOf(Vehicle.label.fields);
const GENERATION_RELATIONS = relationsOf(VehicleGeneration.label.fields);

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/** Provenance columns, read with the records an import compares. */
const PROVENANCE = ["source_tier", "sources", "verified_at"] as const;

export type VehicleSummary = { id: string; label: string; year_start: number; year_end: number | null };

/** A row as the API would store it: parsed by the entity's create DTO, derived fields computed. */
const asCreated = (entity: EntityDef<any, any, any>, row: Row): Row => withDerived(entity, entity.dto.create.parse(row));

export default class VehicleModuleService extends MedusaService(vehicleModels) {
  // ── Catalog import ──────────────────────────────────────────────────────────

  /**
   * Imports a catalog file (`vehicle-catalog@1`) in one transaction: creates
   * the makes, models, generations, engines, configurations and references it
   * lacks, matched by natural key. Existing values the file contradicts are
   * reported (`mode: "create"`, the default), written only where the record
   * has none (`fill`), also where a lower trust tier set them (`merge`), or
   * written (`overwrite`, for reviewed files). Records it creates, updates or
   * confirms get its provenance (tier, source, verified_at). Nothing is
   * written with `dryRun` or when the file has problems.
   */
  @InjectTransactionManager()
  async importCatalog(
    file: CatalogFile,
    options: { dryRun?: boolean; mode?: CatalogImportMode; now?: Date; touch?: boolean } = {},
    @MedusaContext() ctx: Context = {},
  ): Promise<CatalogImportReport> {
    const mode = options.mode ?? "create";
    const plan = planCatalog(file, await this.catalogSnapshot_(file, ctx), { mode, now: options.now, touch: options.touch });
    const problems = [...validateCatalog(file), ...plan.problems];
    const report: CatalogImportReport = {
      dryRun: !!options.dryRun,
      problems,
      created: {
        makes: plan.makes.length,
        models: plan.models.length,
        generations: plan.generations.length,
        engines: plan.engines.length,
        vehicles: plan.vehicles.length,
        references: plan.references.length,
      },
      existing: plan.existing,
      mode,
      updated: plan.updates.flatMap((u) => u.changes),
      differences: plan.differences,
      warnings: plan.warnings,
      touched: plan.touches.length,
    };
    if (problems.length || options.dryRun) return report;

    const update = (entity: string) =>
      plan.updates.filter((u) => u.entity === entity).map((u) => ({ id: u.id, ...u.data, ...(u.provenance ?? {}) }));
    const models = update("VehicleModel");
    const generations = update("VehicleGeneration");
    const vehicles = update("Vehicle");
    if (models.length) await this.updateVehicleModels(models as any[], ctx);
    if (generations.length) await this.updateVehicleGenerations(generations as any[], ctx);
    if (vehicles.length) await this.updateVehicles(vehicles as any[], ctx);
    const checked = new Set<string>(vehicles.map((v) => v.id as string));

    const ids = new Map<string, string>();
    const id = (ref: CatalogRef) => ("id" in ref ? ref.id : ids.get(ref.key)!);
    const remember = (keys: string[], rows: { id: string }[]) => keys.forEach((key, i) => ids.set(key, rows[i]!.id));

    if (plan.makes.length) {
      const rows = plan.makes.map((m) => ({ ...asCreated(VehicleMake, { name: m.data.name, slug: m.data.name, logo: null }), ...m.provenance }));
      remember(plan.makes.map((m) => m.key), await this.createVehicleMakes(rows as any[], ctx));
    }
    if (plan.models.length) {
      const rows = plan.models.map((m) =>
        ({ ...asCreated(VehicleModel, { ...m.data, slug: m.data.name, image: null, make_id: id(m.make) }), ...m.provenance }),
      );
      remember(plan.models.map((m) => m.key), await this.createVehicleModels(rows as any[], ctx));
    }
    if (plan.generations.length) {
      const rows = plan.generations.map((g) => ({
        ...asCreated(VehicleGeneration, { ...g.data, image: null, model_id: id(g.model) }),
        ...g.provenance,
      }));
      remember(plan.generations.map((g) => g.key), await this.createVehicleGenerations(rows as any[], ctx));
    }
    if (plan.engines.length) {
      const rows = plan.engines.map((e) => ({ ...asCreated(VehicleEngine, e.data), ...e.provenance }));
      remember(plan.engines.map((e) => e.key), await this.createVehicleEngines(rows as any[], ctx));
    }
    if (plan.vehicles.length) {
      const rows = plan.vehicles.map((v) =>
        ({ ...asCreated(Vehicle, { ...v.data, generation_id: id(v.generation), engine_id: id(v.engine) }), ...v.provenance }),
      );
      const created = await this.createVehicles(rows as any[], ctx);
      remember(plan.vehicles.map((v) => v.key), created);
      created.forEach((v) => checked.add(v.id));
    }
    if (plan.references.length) {
      const rows = plan.references.map((r) => asCreated(VehicleReference, { ...r.data, vehicle_id: id(r.vehicle) }));
      await this.createVehicleReferences(rows as any[], ctx);
    }
    await this.stampProvenance_(plan.touches, ctx);
    // Safety net behind the plan's checks (the rule the entity hook enforces on
    // API writes): written configurations, and those of updated generations,
    // fall within their generation's years; otherwise the transaction rolls back.
    if (generations.length) {
      const affected = await this.listVehicles({ generation_id: generations.map((g) => g.id as string) }, { select: ["id"] }, ctx);
      affected.forEach((v) => checked.add(v.id));
    }
    if (checked.size) await this.assertWithinGeneration([...checked], ctx);
    return report;
  }

  // ── Provenance ─────────────────────────────────────────────────────────────

  /** List and update a catalog entity's records (provenance writes). */
  private records_(entity: CatalogRecordEntity) {
    const crud: Record<CatalogRecordEntity, { list: (f: any, c: any, ctx: Context) => Promise<any[]>; update: (r: any[], ctx: Context) => Promise<unknown> }> = {
      VehicleMake: { list: (f, c, x) => this.listVehicleMakes(f, c, x), update: (r, x) => this.updateVehicleMakes(r, x) },
      VehicleModel: { list: (f, c, x) => this.listVehicleModels(f, c, x), update: (r, x) => this.updateVehicleModels(r, x) },
      VehicleGeneration: { list: (f, c, x) => this.listVehicleGenerations(f, c, x), update: (r, x) => this.updateVehicleGenerations(r, x) },
      VehicleEngine: { list: (f, c, x) => this.listVehicleEngines(f, c, x), update: (r, x) => this.updateVehicleEngines(r, x) },
      Vehicle: { list: (f, c, x) => this.listVehicles(f, c, x), update: (r, x) => this.updateVehicles(r, x) },
    };
    return crud[entity];
  }

  /**
   * Staff created or edited these records in the admin: their values become
   * HUMAN tier, which imports never overwrite. Returns the previous
   * provenance, for `restoreProvenance` when the write rolls back.
   */
  @InjectTransactionManager()
  async pinHuman(entity: CatalogRecordEntity, ids: string[], @MedusaContext() ctx: Context = {}): Promise<Row[]> {
    if (!ids.length) return [];
    const { list, update } = this.records_(entity);
    const previous = await list({ id: ids }, { select: ["id", "source_tier", "sources", "verified_at"] }, ctx);
    const now = new Date();
    const admin: SourceRef = { name: "admin", url: null, tier: SourceTier.HUMAN, at: now.toISOString().slice(0, 10) };
    await update(
      previous.map((r) => ({ id: r.id, source_tier: SourceTier.HUMAN, sources: mergeSources(r.sources, admin), verified_at: now })),
      ctx,
    );
    return previous;
  }

  @InjectTransactionManager()
  async restoreProvenance(entity: CatalogRecordEntity, previous: Row[], @MedusaContext() ctx: Context = {}) {
    if (previous.length) await this.records_(entity).update(previous, ctx);
  }

  /** Writes the provenance of records an import confirmed, one batch per entity. */
  @InjectTransactionManager()
  protected async stampProvenance_(touches: CatalogTouch[], @MedusaContext() ctx: Context = {}) {
    const rows = (entity: CatalogTouch["entity"]) =>
      touches.filter((t) => t.entity === entity).map((t) => ({ id: t.id, ...t.provenance }));
    const writes: [CatalogTouch["entity"], (rows: any[], ctx: Context) => Promise<unknown>][] = [
      ["VehicleMake", (r, c) => this.updateVehicleMakes(r, c)],
      ["VehicleModel", (r, c) => this.updateVehicleModels(r, c)],
      ["VehicleGeneration", (r, c) => this.updateVehicleGenerations(r, c)],
      ["VehicleEngine", (r, c) => this.updateVehicleEngines(r, c)],
      ["Vehicle", (r, c) => this.updateVehicles(r, c)],
    ];
    for (const [entity, write] of writes) {
      const batch = rows(entity);
      if (batch.length) await write(batch, ctx);
    }
  }

  /** The existing records a catalog file can match (its makes' subtree, its engines' powers, its references). */
  @InjectManager()
  protected async catalogSnapshot_(file: CatalogFile, @MedusaContext() ctx: Context = {}): Promise<CatalogSnapshot> {
    const names = new Set(file.makes.map((m) => m.name.trim().toLowerCase()));
    const makes = (await this.listVehicleMakes({}, { select: ["id", "name", ...PROVENANCE] }, ctx)).filter((m) =>
      names.has(m.name.trim().toLowerCase()),
    );
    const models = makes.length
      ? await this.listVehicleModels(
          { make_id: makes.map((m) => m.id) },
          { select: ["id", "make_id", "name", "category", ...PROVENANCE] },
          ctx,
        )
      : [];
    const generations = models.length
      ? await this.listVehicleGenerations(
          { model_id: models.map((m) => m.id) },
          { select: ["id", "model_id", "name", "code", "year_start", "year_end", ...PROVENANCE] },
          ctx,
        )
      : [];
    const vehiclesIn = file.makes.flatMap((m) => m.models.flatMap((mo) => mo.generations.flatMap((g) => g.vehicles)));
    const powers = [...new Set(vehiclesIn.map((v) => v.engine.power_kw))];
    const engines = powers.length
      ? await this.listVehicleEngines(
          { power_kw: powers },
          { select: ["id", "code", "fuel", "layout", "cylinders", "displacement_cc", "power_kw", ...PROVENANCE] },
          ctx,
        )
      : [];
    const vehicles = generations.length
      ? await this.listVehicles(
          { generation_id: generations.map((g) => g.id) },
          {
            select: [
              "id", "generation_id", "engine_id", "body_style", "drive", "transmission", "trim", "year_start", "year_end", "doors",
              ...PROVENANCE,
            ],
          },
          ctx,
        )
      : [];
    const externalIds = [...new Set(vehiclesIn.flatMap((v) => v.references.map((r) => r.external_id)))];
    const references = externalIds.length
      ? await this.listVehicleReferences(
          { external_id: externalIds },
          { select: ["source", "external_id", "vehicle_id"] },
          ctx,
        )
      : [];
    return { makes, models, generations, engines, vehicles, references } as unknown as CatalogSnapshot;
  }

  /** Existing records of a make (optionally one model) as a catalog file. */
  @InjectManager()
  async exportCatalog(
    filter: { make: string; model?: string },
    @MedusaContext() ctx: Context = {},
  ): Promise<CatalogFile> {
    const lower = (v: string) => v.trim().toLowerCase();
    const makes = (await this.listVehicleMakes({}, { select: ["id", "name"] }, ctx)).filter(
      (m) => lower(m.name) === lower(filter.make),
    );
    const models = makes.length
      ? (
          await this.listVehicleModels({ make_id: makes.map((m) => m.id) }, { select: ["id", "make_id", "name", "category"] }, ctx)
        ).filter((m) => !filter.model || lower(m.name) === lower(filter.model))
      : [];
    const generations = models.length
      ? await this.listVehicleGenerations(
          { model_id: models.map((m) => m.id) },
          { select: ["id", "model_id", "name", "code", "year_start", "year_end"] },
          ctx,
        )
      : [];
    const vehicles = generations.length
      ? await this.listVehicles({ generation_id: generations.map((g) => g.id) }, { relations: ["engine"] }, ctx)
      : [];
    const references = vehicles.length
      ? await this.listVehicleReferences(
          { vehicle_id: vehicles.map((v) => v.id) },
          { select: ["vehicle_id", "source", "external_id"] },
          ctx,
        )
      : [];
    return recordsToCatalog(
      { makes, models, generations, vehicles, references } as unknown as CatalogRecords,
      { name: "Catalog export", retrieved_at: new Date().toISOString() },
    );
  }

  /** Every model's coverage (optionally one make's), least complete first. */
  @InjectManager()
  async catalogCoverage(filter: { make?: string } = {}, @MedusaContext() ctx: Context = {}): Promise<ModelCoverage[]> {
    const lower = (v: string) => v.trim().toLowerCase();
    const makes = (await this.listVehicleMakes({}, { select: ["id", "name"] }, ctx)).filter(
      (m) => !filter.make || lower(m.name) === lower(filter.make),
    );
    const models = makes.length
      ? await this.listVehicleModels({ make_id: makes.map((m) => m.id) }, { select: ["id", "make_id", "name", "category"] }, ctx)
      : [];
    const generations = models.length
      ? await this.listVehicleGenerations({ model_id: models.map((m) => m.id) }, { select: ["id", "model_id"] }, ctx)
      : [];
    const vehicles = generations.length
      ? await this.listVehicles({ generation_id: generations.map((g) => g.id) }, { select: ["generation_id"] }, ctx)
      : [];
    return catalogCoverage({ makes, models, generations, vehicles } as any);
  }

  /**
   * Research tasks, most useful first (see `researchTasks`), optionally for
   * one make; a page of them, each configuration task with the generation's
   * existing configurations.
   */
  @InjectManager()
  async catalogResearchTasks(
    filter: { make?: string; maxConfigurations?: number; limit?: number; offset?: number } = {},
    @MedusaContext() ctx: Context = {},
  ): Promise<{ tasks: Omit<ResearchTask, "generation_id">[]; count: number }> {
    const lower = (v: string) => v.trim().toLowerCase();
    const makes = (await this.listVehicleMakes({}, { select: ["id", "name"] }, ctx)).filter(
      (m) => !filter.make || lower(m.name) === lower(filter.make),
    );
    const models = makes.length
      ? await this.listVehicleModels({ make_id: makes.map((m) => m.id) }, { select: ["id", "make_id", "name", "category"] }, ctx)
      : [];
    const generations = models.length
      ? await this.listVehicleGenerations(
          { model_id: models.map((m) => m.id) },
          { select: ["id", "model_id", "name", "code", "year_start", "year_end"] },
          ctx,
        )
      : [];
    const counts = generations.length
      ? await this.listVehicles({ generation_id: generations.map((g) => g.id) }, { select: ["generation_id"] }, ctx)
      : [];
    const all = researchTasks({ makes, models, generations, vehicles: counts } as any, {
      maxConfigurations: filter.maxConfigurations,
    });
    const offset = filter.offset ?? 0;
    const page = all.slice(offset, offset + (filter.limit ?? 10));

    const withExisting = page.flatMap((t) => (t.kind === "configurations" && t.configurations > 0 ? [t.generation_id] : []));
    const existing = withExisting.length
      ? ((await this.listVehicles({ generation_id: withExisting }, { relations: ["engine"] }, ctx)) as Row[])
      : [];
    const tasks = page.map((t) => {
      if (t.kind !== "configurations") return t;
      const { generation_id, ...task } = t;
      const vehicles = existing.filter((v) => v.generation_id === generation_id).sort((a, b) => a.year_start - b.year_start);
      return { ...task, existing: vehicles.map((v) => toCatalogVehicle(v as any)) };
    });
    return { tasks, count: all.length };
  }

  // ── Maintenance ledger ─────────────────────────────────────────────────────

  /** Everything the ledger and the rules read, in a few queries. */
  @InjectManager()
  protected async ledgerRecords_(@MedusaContext() ctx: Context = {}): Promise<LedgerRecords & LintRecords> {
    const prov = ["source_tier", "verified_at"];
    const [makes, models, generations, vehicles, engines, references] = await Promise.all([
      this.listVehicleMakes({}, { select: ["id", "name"] }, ctx),
      this.listVehicleModels({}, { select: ["id", "make_id", "name", "category", "on_sale_new", ...prov] }, ctx),
      this.listVehicleGenerations({}, { select: ["id", "model_id", "name", "code", "year_start", "year_end", ...prov] }, ctx),
      this.listVehicles(
        {},
        { select: ["id", "generation_id", "engine_id", "body_style", "doors", "drive", "transmission", "trim", "year_start", "year_end", ...prov] },
        ctx,
      ),
      this.listVehicleEngines({}, { select: ["id", "code", "fuel", "layout", "cylinders", "displacement_cc", "power_kw", ...prov] }, ctx),
      this.listVehicleReferences({}, { select: ["id", "vehicle_id", "source", "external_id"] }, ctx),
    ]);
    return { makes, models, generations, vehicles, engines, references } as unknown as LedgerRecords & LintRecords;
  }

  /**
   * Brings the ledger in line with the catalog: a task for each gap to
   * research and each unit due for verification (priorities refreshed, closed
   * tasks reopened), and tasks no longer needed closed. Tasks waiting for a
   * person (REVIEW) and leased ones are left alone.
   */
  @InjectTransactionManager()
  async refreshTasks(
    options: { maxConfigurations?: number; now?: Date } = {},
    @MedusaContext() ctx: Context = {},
  ): Promise<{ created: number; reopened: number; closed: number; open: number }> {
    const now = options.now ?? new Date();
    const candidates = taskCandidates(await this.ledgerRecords_(ctx), { now, maxConfigurations: options.maxConfigurations });
    const existing = await this.listCatalogTasks(
      { kind: STEWARD_KINDS },
      { select: ["id", "kind", "key", "status", "priority", "attempts", "record_id", "next_run_at"] },
      ctx,
    );
    const byKey = new Map(existing.map((t) => [`${t.kind}|${t.key}`, t]));
    const wanted = new Set<string>();
    const create: Row[] = [];
    const update: Row[] = [];
    let reopened = 0;
    for (const c of candidates) {
      const id = `${c.kind}|${c.key}`;
      if (wanted.has(id)) continue; // two records with one natural key (e.g. "Clio" and "Clio "): lint flags them
      wanted.add(id);
      const task = byKey.get(id);
      const names = { make: c.make, model: c.model, generation: c.generation, entity: c.entity, record_id: c.record_id };
      if (!task) {
        create.push({ kind: c.kind, key: c.key, ...names, status: CatalogTaskStatus.PENDING, priority: c.priority });
        continue;
      }
      const failures = task.status === CatalogTaskStatus.FAILED ? task.attempts : 0;
      const priority = effectivePriority(c.priority, failures);
      if (task.status === CatalogTaskStatus.DONE) {
        // Closed with a pause (a rejection, a verified unit): not reopened before it ends.
        if (task.next_run_at && new Date(task.next_run_at) > now) continue;
        reopened++;
        update.push({ id: task.id, ...names, status: CatalogTaskStatus.PENDING, priority, attempts: 0, next_run_at: null });
      } else if (task.priority !== priority || task.record_id !== c.record_id) {
        update.push({ id: task.id, ...names, priority });
      }
    }
    const closable = new Set<string>([CatalogTaskStatus.PENDING, CatalogTaskStatus.APPLIED, CatalogTaskStatus.NO_DATA, CatalogTaskStatus.FAILED]);
    const closed = existing.filter((t) => !wanted.has(`${t.kind}|${t.key}`) && closable.has(t.status));
    for (const t of closed) update.push({ id: t.id, status: CatalogTaskStatus.DONE, next_run_at: null, lease_until: null, lease_token: null });
    for (let i = 0; i < create.length; i += 500) await this.createCatalogTasks(create.slice(i, i + 500) as any[], ctx);
    for (let i = 0; i < update.length; i += 500) await this.updateCatalogTasks(update.slice(i, i + 500) as any[], ctx);
    const open = candidates.length;
    return { created: create.length, reopened, closed: closed.length, open };
  }

  /**
   * Leases the most valuable tasks a worker may run now (optionally of some
   * kinds, or one make): status RUNNING, a lease token the result must carry,
   * and an expiry after which another worker may take the task over.
   */
  @InjectTransactionManager()
  async claimTasks(
    options: { limit?: number; kinds?: CatalogTaskKind[]; make?: string; now?: Date; leaseMinutes?: number } = {},
    @MedusaContext() ctx: Context = {},
  ) {
    const now = options.now ?? new Date();
    const leaseUntil = new Date(now.getTime() + (options.leaseMinutes ?? 60) * 60_000);
    const kinds = options.kinds?.length ? options.kinds : STEWARD_KINDS;
    // One statement, rows locked and skipped by concurrent claims: two workers
    // (or two backend instances) never lease the same task.
    const rows: { id: string }[] = await (ctx.transactionManager as any).execute(
      `update catalog_task set status = 'RUNNING', lease_token = gen_random_uuid()::text, lease_until = ?,
         attempts = attempts + 1, last_run_at = ?, updated_at = now()
       where id in (
         select id from catalog_task
         where deleted_at is null and kind in (?) and (?::text is null or make = ?)
           and (
             (status = 'PENDING' and (next_run_at is null or next_run_at <= ?))
             or (status in ('APPLIED', 'NO_DATA', 'FAILED') and (next_run_at is null or next_run_at <= ?))
             or (status = 'RUNNING' and (lease_until is null or lease_until < ?))
           )
         order by priority desc, created_at asc
         limit ?
         for update skip locked
       )
       returning id`,
      [leaseUntil, now, kinds, options.make ?? null, options.make ?? null, now, now, now, options.limit ?? 10],
    );
    if (!rows.length) return [];
    const tasks = await this.listCatalogTasks({ id: rows.map((r) => r.id) }, { order: { priority: "DESC", created_at: "ASC" } }, ctx);
    return tasks as Row[];
  }

  /** What a task is about, as the catalog has it, plus the source pages known for it. */
  @InjectManager()
  async taskContext(taskId: string, @MedusaContext() ctx: Context = {}): Promise<{ task: Row; context: StewardContext; urls: string[] }> {
    const task = (await this.retrieveCatalogTask(taskId, {}, ctx)) as Row;
    const genSelect = ["id", "model_id", "name", "code", "year_start", "year_end", "source_tier", "sources"];
    let generationRow: Row | undefined;
    let modelId = task.record_id as string;
    if (task.entity === CatalogEntityName.VehicleGeneration) {
      generationRow = (await this.retrieveVehicleGeneration(task.record_id, { select: genSelect }, ctx)) as Row;
      modelId = generationRow.model_id;
    }
    const model = (await this.retrieveVehicleModel(modelId, { select: ["id", "make_id", "name", "category", "source_tier", "sources"] }, ctx)) as Row;
    const make = (await this.retrieveVehicleMake(model.make_id, { select: ["id", "name"] }, ctx)) as Row;
    const generations = ((await this.listVehicleGenerations({ model_id: model.id }, { select: genSelect }, ctx)) as Row[]).sort(
      (a, b) => a.year_start - b.year_start,
    );
    const context: StewardContext = {
      kind: task.kind,
      feedback: task.feedback,
      make: { id: make.id, name: make.name },
      model: { id: model.id, name: model.name, category: model.category, source_tier: model.source_tier },
      generations: generations.map(pickGeneration),
    };
    const urls = new Set<string>();
    const addUrls = (sources: SourceRef[] | null | undefined) => (sources ?? []).forEach((s) => s.url && urls.add(s.url));
    if (generationRow) {
      context.generation = pickGeneration(generationRow);
      const vehicles = ((await this.listVehicles({ generation_id: generationRow.id }, { relations: ["engine"] }, ctx)) as Row[]).sort(
        (a, b) => a.year_start - b.year_start || (a.engine?.power_kw ?? 0) - (b.engine?.power_kw ?? 0),
      );
      context.vehicles = vehicles.map((v) => ({
        id: v.id,
        engine_id: v.engine_id,
        body_style: v.body_style,
        doors: v.doors,
        drive: v.drive,
        transmission: v.transmission,
        trim: v.trim,
        year_start: v.year_start,
        year_end: v.year_end,
        source_tier: v.source_tier,
      }));
      const engines = new Map<string, Row>(vehicles.filter((v) => v.engine).map((v) => [v.engine.id, v.engine]));
      context.engines = [...engines.values()].map((e) => ({
        id: e.id,
        code: e.code,
        fuel: e.fuel,
        layout: e.layout,
        cylinders: e.cylinders,
        displacement_cc: e.displacement_cc,
        power_kw: e.power_kw,
        source_tier: e.source_tier,
      }));
      addUrls(generationRow.sources);
    }
    addUrls(model.sources);
    generations.forEach((g) => addUrls(g.sources));
    // Pages other tasks of this model read.
    const siblings = await this.listCatalogTasks({ make: make.name, model: model.name }, { select: ["sources"] }, ctx);
    siblings.forEach((t) => (t.sources ?? []).forEach((u: string) => urls.add(u)));
    return { task, context, urls: [...urls] };
  }

  /** What ran since `since`: outcomes by status and kind, spend, and what waits for review. */
  @InjectManager()
  async taskSummary(since: Date, @MedusaContext() ctx: Context = {}) {
    const ran = (await this.listCatalogTasks(
      { last_run_at: { $gte: since } },
      { select: ["kind", "status", "make", "model", "generation", "cost", "report"] },
      ctx,
    )) as Row[];
    const count = (rows: Row[], key: string) => rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {});
    const review = await this.listCatalogTasks({ status: CatalogTaskStatus.REVIEW }, { select: ["id"] }, ctx);
    return {
      ran: ran.length,
      by_status: count(ran, "status"),
      by_kind: count(ran, "kind"),
      usd: Math.round(ran.reduce((n, r) => n + (r.cost?.usd ?? 0), 0) * 10_000) / 10_000,
      credits: ran.reduce((n, r) => n + (r.cost?.credits ?? 0), 0),
      waiting_review: review.length,
      applied: ran
        .filter((r) => r.status === CatalogTaskStatus.APPLIED || (r.status === CatalogTaskStatus.DONE && r.report?.reason === "verified"))
        .map((r) => [r.make, r.model, r.generation].filter(Boolean).join(" ") + (r.report?.reason ? ` (${r.report.reason})` : ""))
        .slice(0, 30),
    };
  }

  /** The task, if `token` is its current lease (a worker's calls must carry it). */
  @InjectManager()
  async leasedTask(taskId: string, token: string, @MedusaContext() ctx: Context = {}) {
    const task = (await this.retrieveCatalogTask(taskId, {}, ctx)) as Row;
    if (task.status !== CatalogTaskStatus.RUNNING || task.lease_token !== token) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This task's lease expired or belongs to another run.");
    }
    return task;
  }

  /** Adds pages read and search credits spent to a task (its sources feed sibling tasks). */
  @InjectTransactionManager()
  async noteTaskUsage(taskId: string, usage: { urls?: string[]; credits?: number }, @MedusaContext() ctx: Context = {}) {
    const [task] = (await this.listCatalogTasks({ id: taskId }, { select: ["id", "sources", "cost"] }, ctx)) as Row[];
    if (!task) return;
    const sources = [...new Set([...(task.sources ?? []), ...(usage.urls ?? [])])].slice(-20);
    await this.updateCatalogTasks([{ id: taskId, sources, cost: addCost(task.cost, { credits: usage.credits ?? 0 }) }] as any[], ctx);
  }

  /**
   * Records a worker's result for a leased task and applies it by the
   * steward's policy (see the domain's README):
   * - research: quotes checked, then a dry run; applied (merge, research tier)
   *   when clean, else kept for review (problems, likely duplicates, mostly
   *   assumed values); nothing new → NO_DATA;
   * - verification: confirmed records stamped, corrections of draft (or
   *   blank) values applied, the rest kept for review, missing records added.
   * The task then waits by its outcome (backoff).
   */
  @InjectTransactionManager()
  async submitTaskResult(taskId: string, input: TaskResultInput, @MedusaContext() ctx: Context = {}): Promise<TaskResult> {
    const now = new Date();
    const task = (await this.retrieveCatalogTask(taskId, {}, ctx)) as Row;
    if (task.status !== CatalogTaskStatus.RUNNING || task.lease_token !== input.lease_token) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This task's lease expired or belongs to another run.");
    }
    // The research agent's answer, however the model wrote it (JSON text, wrapped, with prose).
    const answer =
      input.answer === undefined
        ? null
        : agentDraftFile(input.answer, { make: task.make ?? "", model: task.model ?? "" }, {
            name: input.model ? `AI research agent (${input.model})` : "AI research agent",
            retrieved_at: now.toISOString().slice(0, 10),
          });
    const answered = answer && !("problems" in answer) ? answer : null;
    const notes = input.notes ?? answered?.notes ?? null;
    const sources = [
      ...new Set([...(task.sources ?? []), ...(input.sources ?? []), ...(answered && "sources" in answered ? answered.sources : []), ...(input.evidence ?? []).map((e) => e.url)]),
    ].slice(-20);
    const cost = addCost(task.cost, input.cost, input.model);
    const verification = task.kind === CatalogTaskKind.VERIFY_MODEL || task.kind === CatalogTaskKind.VERIFY_GENERATION;
    const finish = async (status: CatalogTaskStatus, reason: string, report: Row, extra: Row = {}): Promise<TaskResult> => {
      // A first attempt that didn't apply keeps the lease, for the fallback to try; a proposal it made waits on the lease.
      if (input.final === false && status !== CatalogTaskStatus.APPLIED) {
        const attempt = { status, reason, model: input.model ?? null, at: now.toISOString(), report };
        const review = status === CatalogTaskStatus.REVIEW && extra.proposal ? { pending_review: { reason, report, proposal: extra.proposal } } : {};
        await this.updateCatalogTasks(
          [{ id: task.id, sources, cost, report: { ...(task.report ?? {}), ...review, attempts: [...((task.report?.attempts as Row[]) ?? []), attempt].slice(-5) } }] as any[],
          ctx,
        );
        return { status, reason, report, final: false };
      }
      // The fallback found nothing better (failed, no data): the first attempt's proposal goes to review.
      const pending = task.report?.pending_review as Row | undefined;
      if (pending && status !== CatalogTaskStatus.APPLIED && status !== CatalogTaskStatus.REVIEW) {
        ({ status, reason, report, extra } = {
          status: CatalogTaskStatus.REVIEW,
          reason: pending.reason,
          report: { ...pending.report, fallback: { status, reason, model: input.model ?? null, error: input.error ?? null } },
          extra: { proposal: pending.proposal },
        });
      }
      // A verified unit is done: the ledger reopens it when its records fall due again.
      const stored = verification && status === CatalogTaskStatus.APPLIED ? CatalogTaskStatus.DONE : status;
      // A verified unit whose records partly stay due (not found in the source) waits a month, not a night.
      const next = stored === CatalogTaskStatus.DONE ? new Date(now.getTime() + 30 * 86_400_000) : nextRun(stored, task.attempts, now);
      await this.updateCatalogTasks(
        [
          {
            id: task.id,
            status: stored,
            next_run_at: next,
            lease_until: null,
            lease_token: null,
            report: { ...report, reason, model: input.model ?? null, notes, at: now.toISOString() },
            sources,
            cost,
            attention: false,
            ...extra,
          },
        ] as any[],
        ctx,
      );
      return { status, reason, report };
    };
    if (input.error) return finish(CatalogTaskStatus.FAILED, "error", { error: input.error });

    const { context } = await this.taskContext(taskId, ctx);
    const evidenceText = (input.evidence ?? []).map((e) => e.text).join("\n\n");
    const source = {
      name: input.model ? `AI research (${input.model})` : "AI research",
      url: input.evidence?.[0]?.url ?? input.sources?.[0] ?? "",
      retrievedAt: now.toISOString().slice(0, 10),
    };
    const research = task.kind === CatalogTaskKind.RESEARCH_GENERATIONS || task.kind === CatalogTaskKind.RESEARCH_CONFIGURATIONS;

    if (research) {
      let file: CatalogFile | null;
      let checked: Row = {};
      if (answer) {
        if ("problems" in answer) return finish(CatalogTaskStatus.FAILED, "invalid answer", { problems: answer.problems.slice(0, 20) });
        file = "file" in answer ? scopeFile(answer.file, context) : null;
      } else if (input.file) {
        file = scopeFile(input.file, context);
      } else {
        const output = parseOutput(task.kind, input.output);
        if (!output) return finish(CatalogTaskStatus.FAILED, "invalid output", {});
        const result = researchFile(context, output as any, evidenceText, source);
        file = result.file;
        checked = { unsupported: result.unsupported, assumed: result.assumed, kept: result.kept };
        if (file && result.kept && result.assumed / result.kept > 0.5) {
          const dry = await this.importCatalog(file, { dryRun: true, mode: "merge" }, ctx);
          return finish(CatalogTaskStatus.REVIEW, "mostly assumed values", { ...checked, ...dry }, { proposal: file });
        }
      }
      if (!file) return finish(CatalogTaskStatus.NO_DATA, (checked.unsupported as string[] | undefined)?.length ? "unsupported" : "nothing found", checked);
      const dry = await this.importCatalog(file, { dryRun: true, mode: "merge" }, ctx);
      const report = { ...checked, ...dry };
      if (dry.problems.length) return finish(CatalogTaskStatus.REVIEW, "problems", report, { proposal: file });
      if (dry.warnings.length) return finish(CatalogTaskStatus.REVIEW, "possible duplicates", report, { proposal: file });
      const adds = dry.created.generations + dry.created.vehicles + dry.updated.length;
      if (!adds && !dry.touched) return finish(CatalogTaskStatus.NO_DATA, "nothing new", report);
      const applied = await this.importCatalog(file, { mode: "merge" }, ctx);
      return finish(CatalogTaskStatus.APPLIED, adds ? "applied" : "confirmed", { ...checked, ...applied }, { attention: applied.differences.length > 0 });
    }

    // Verification.
    const output = parseOutput(task.kind, input.output);
    if (!output) return finish(CatalogTaskStatus.FAILED, "invalid output", {});
    const outcome = verificationOutcome(context, output as any, evidenceText, source);
    // A configuration's first year is part of its identity: changed by a person only.
    const apply = outcome.apply.filter((c) => !(c.entity === "Vehicle" && c.field === "year_start"));
    const review = [...outcome.review, ...outcome.apply.filter((c) => c.entity === "Vehicle" && c.field === "year_start")];
    const ref: SourceRef = { name: source.name, url: source.url || null, tier: SourceTier.RESEARCH, at: source.retrievedAt };
    await this.stampConfirmed_(outcome.confirmed, ref, now, ctx);
    const appliedChanges = await this.applyCorrections_(context, apply, ref, now, ctx);
    review.push(...appliedChanges.refused);
    let missing: Row | null = null;
    if (outcome.missing) {
      const dry = await this.importCatalog(outcome.missing, { dryRun: true, mode: "merge", touch: false }, ctx);
      if (dry.problems.length || dry.warnings.length) missing = { file: outcome.missing, report: dry };
      else await this.importCatalog(outcome.missing, { mode: "merge", touch: false }, ctx);
    }
    const report = {
      confirmed: outcome.confirmed.length,
      corrected: appliedChanges.applied.map(describeCorrection),
      review: review.map(describeCorrection),
      missing: outcome.missing ? countVehicles(outcome.missing) : 0,
      unsupported: outcome.unsupported,
    };
    if (review.length || missing) {
      return finish(CatalogTaskStatus.REVIEW, review.length ? "corrections to review" : "missing records to review", report, {
        proposal: { corrections: review, missing },
      });
    }
    if (outcome.confirmed.length || appliedChanges.applied.length || outcome.missing) {
      return finish(CatalogTaskStatus.APPLIED, "verified", report);
    }
    return finish(CatalogTaskStatus.NO_DATA, outcome.unsupported.length ? "unsupported" : "nothing found", report);
  }

  /** Stamps records a source confirmed: verified now, the source added, draft raised to research. */
  @InjectTransactionManager()
  protected async stampConfirmed_(
    confirmed: VerificationOutcome["confirmed"],
    ref: SourceRef,
    now: Date,
    @MedusaContext() ctx: Context = {},
  ) {
    const touches: CatalogTouch[] = [];
    for (const entity of ["VehicleModel", "VehicleGeneration", "Vehicle", "VehicleEngine"] as const) {
      const ids = confirmed.filter((c) => c.entity === entity).map((c) => c.id);
      if (!ids.length) continue;
      const rows = await this.records_(entity).list({ id: ids }, { select: ["id", "source_tier", "sources"] }, ctx);
      for (const r of rows) {
        touches.push({ entity, id: r.id, provenance: { source_tier: higherTier(r.source_tier, SourceTier.RESEARCH), sources: mergeSources(r.sources, ref), verified_at: now } });
      }
    }
    await this.stampProvenance_(touches, ctx);
  }

  /**
   * Applies corrections a verification may make on its own (draft or blank
   * values of generations and configurations), when the catalog's rules
   * still hold afterwards; the others come back as refused (for review).
   */
  @InjectTransactionManager()
  protected async applyCorrections_(
    context: StewardContext,
    corrections: Correction[],
    ref: SourceRef,
    now: Date,
    @MedusaContext() ctx: Context = {},
  ): Promise<{ applied: Correction[]; refused: Correction[] }> {
    const applied: Correction[] = [];
    const refused: Correction[] = [];
    const byRecord = new Map<string, Correction[]>();
    for (const c of corrections) byRecord.set(c.id, [...(byRecord.get(c.id) ?? []), c]);
    for (const [id, changes] of byRecord) {
      const entity = changes[0]!.entity;
      if (entity === "VehicleEngine") {
        refused.push(...changes);
        continue;
      }
      const record =
        entity === "VehicleGeneration" ? context.generations.find((g) => g.id === id) : context.vehicles?.find((v) => v.id === id);
      if (!record) {
        refused.push(...changes);
        continue;
      }
      const after = { ...record, ...Object.fromEntries(changes.map((c) => [c.field, c.to])) } as Row;
      // Years stay coherent: a generation keeps its configurations, a configuration fits its generation.
      const within = (inner: Row, outer: Row) =>
        inner.year_start >= outer.year_start && (outer.year_end == null || (inner.year_end != null && inner.year_end <= outer.year_end));
      // A generation's configurations: from the context when it is the task's, else read (model verification).
      const configurations =
        entity === "VehicleGeneration"
          ? context.generation?.id === id
            ? (context.vehicles ?? [])
            : ((await this.listVehicles({ generation_id: id }, { select: ["year_start", "year_end"] }, ctx)) as Row[])
          : [];
      const ok =
        (after.year_end == null || after.year_end >= after.year_start) &&
        (entity === "VehicleGeneration" ? configurations.every((v) => within(v, after)) : within(after, context.generation!));
      if (!ok) {
        refused.push(...changes);
        continue;
      }
      const current = await this.records_(entity).list({ id }, { select: ["id", "source_tier", "sources"] }, ctx);
      await this.records_(entity).update(
        [
          {
            id,
            ...Object.fromEntries(changes.map((c) => [c.field, c.to])),
            source_tier: higherTier(current[0]?.source_tier, SourceTier.RESEARCH),
            sources: mergeSources(current[0]?.sources, ref),
            verified_at: now,
          },
        ],
        ctx,
      );
      applied.push(...changes);
    }
    return { applied, refused };
  }

  /**
   * Settles a task waiting for review the way its proposal or finding says:
   * a research proposal is imported (overwrite, reference tier: a person
   * reviewed it), verification corrections are written, a cleanup fix is
   * applied (vehicle merges, which touch other modules, go through the
   * domain's workflow). The task is closed.
   */
  @InjectTransactionManager()
  async approveTask(taskId: string, @MedusaContext() ctx: Context = {}): Promise<Row> {
    const task = (await this.retrieveCatalogTask(taskId, {}, ctx)) as Row;
    if (task.status !== CatalogTaskStatus.REVIEW) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only tasks waiting for review can be approved.");
    }
    const now = new Date();
    const result: Row = {};
    const proposal = task.proposal as Row | null;
    if (task.kind === CatalogTaskKind.CLEANUP) {
      const fix = (task.finding as Row | null)?.fix as FindingFix | undefined;
      if (!fix) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This finding proposes no fix: reject it, or fix the record by hand.");
      if (fix.kind === "update") {
        await this.records_(task.entity as CatalogRecordEntity).update([{ id: task.record_id, ...fix.data }], ctx);
        result.updated = fix.data;
      } else if (task.entity === CatalogEntityName.VehicleEngine) {
        result.merged = await this.mergeEngines(task.record_id, fix.into, ctx);
      } else if (task.entity === CatalogEntityName.VehicleGeneration) {
        result.merged = await this.mergeGenerations(task.record_id, fix.into, ctx);
      } else {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Merging ${task.entity} records goes through the domain's merge workflow.`);
      }
    } else if (proposal?.format === "vehicle-catalog@1") {
      // Reviewed: reference tier, merged (what a lower tier set is replaced; staff and licensed values stay).
      const file = { ...(proposal as unknown as CatalogFile), source: { ...(proposal as any).source, tier: SourceTier.REFERENCE } };
      result.import = await this.importCatalog(file, { mode: "merge" }, ctx);
      if ((result.import as CatalogImportReport).problems.length) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, (result.import as CatalogImportReport).problems.join(" "));
      }
    } else if (proposal) {
      const ref: SourceRef = { name: "reviewed correction", url: null, tier: SourceTier.REFERENCE, at: now.toISOString().slice(0, 10) };
      const corrections = (proposal.corrections ?? []) as Correction[];
      for (const c of corrections) {
        const current = await this.records_(c.entity).list({ id: c.id }, { select: ["id", "source_tier", "sources"] }, ctx);
        // Derived columns follow (an engine's hp from its kW).
        const derived = c.entity === "VehicleEngine" && c.field === "power_kw" ? { power_hp: withDerived(VehicleEngine, { power_kw: c.to } as any).power_hp } : {};
        await this.records_(c.entity).update(
          [{ id: c.id, [c.field]: c.to, ...derived, source_tier: higherTier(current[0]?.source_tier, SourceTier.REFERENCE), sources: mergeSources(current[0]?.sources, ref), verified_at: now }],
          ctx,
        );
      }
      if (proposal.missing?.file) result.import = await this.importCatalog(proposal.missing.file, { mode: "merge", touch: false }, ctx);
      // The years still hold: corrected configurations, and those of corrected generations.
      const generations = corrections.filter((c) => c.entity === "VehicleGeneration").map((c) => c.id);
      const affected = generations.length ? await this.listVehicles({ generation_id: generations }, { select: ["id"] }, ctx) : [];
      await this.assertWithinGeneration(
        [...corrections.filter((c) => c.entity === "Vehicle").map((c) => c.id), ...affected.map((v) => v.id)],
        ctx,
      );
    }
    await this.updateCatalogTasks([{ id: task.id, status: CatalogTaskStatus.DONE, next_run_at: null, report: { ...(task.report ?? {}), approved_at: now.toISOString(), result } }] as any[], ctx);
    return result;
  }

  /** Dismisses a proposal or finding: closed, with the reviewer's feedback (given to the next run), not raised again for 180 days. */
  @InjectTransactionManager()
  async rejectTask(taskId: string, feedback: string | null, @MedusaContext() ctx: Context = {}) {
    const task = (await this.retrieveCatalogTask(taskId, {}, ctx)) as Row;
    const now = new Date();
    await this.updateCatalogTasks(
      [{ id: task.id, status: CatalogTaskStatus.DONE, feedback: feedback ?? task.feedback, next_run_at: new Date(now.getTime() + 180 * 86_400_000), proposal: null }] as any[],
      ctx,
    );
  }

  /**
   * Checks every record against the catalog's rules: safe fixes (stray
   * spaces) are applied; errors and warnings become CLEANUP tasks for review
   * (one per finding, closed once fixed; dismissed ones stay quiet for 180
   * days); information findings are only counted.
   */
  @InjectTransactionManager()
  async runLint(options: { now?: Date } = {}, @MedusaContext() ctx: Context = {}) {
    const now = options.now ?? new Date();
    const findings = lintCatalog(await this.ledgerRecords_(ctx), { now });
    const fixed: Finding[] = [];
    for (const f of findings.filter((x) => x.fix?.kind === "update" && x.fix.safe)) {
      await this.records_(f.entity as CatalogRecordEntity).update([{ id: f.id, ...(f.fix as { data: Row }).data }], ctx);
      fixed.push(f);
    }
    const reviewable = findings.filter((f) => !fixed.includes(f) && f.severity !== "info");
    const existing = await this.listCatalogTasks({ kind: CatalogTaskKind.CLEANUP }, { select: ["id", "key", "status", "next_run_at"] }, ctx);
    const byKey = new Map(existing.map((t) => [t.key, t]));
    const create: Row[] = [];
    const update: Row[] = [];
    const seen = new Set<string>();
    for (const f of reviewable) {
      seen.add(f.key);
      const row = {
        rule: f.rule,
        entity: f.entity,
        record_id: f.id,
        make: f.make,
        model: f.model,
        generation: f.generation,
        finding: { severity: f.severity, message: f.message, fix: f.fix ?? null },
        priority: f.severity === "error" ? 90 : 50,
      };
      const task = byKey.get(f.key);
      if (!task) create.push({ kind: CatalogTaskKind.CLEANUP, key: f.key, status: CatalogTaskStatus.REVIEW, ...row });
      else if (task.status === CatalogTaskStatus.DONE && task.next_run_at && new Date(task.next_run_at) > now) continue; // dismissed
      else update.push({ id: task.id, status: CatalogTaskStatus.REVIEW, ...row });
    }
    const resolved = existing.filter((t) => !seen.has(t.key) && t.status === CatalogTaskStatus.REVIEW);
    for (const t of resolved) update.push({ id: t.id, status: CatalogTaskStatus.DONE });
    for (let i = 0; i < create.length; i += 500) await this.createCatalogTasks(create.slice(i, i + 500) as any[], ctx);
    for (let i = 0; i < update.length; i += 500) await this.updateCatalogTasks(update.slice(i, i + 500) as any[], ctx);
    const bySeverity = (s: string) => findings.filter((f) => f.severity === s).length;
    return {
      findings: findings.length,
      errors: bySeverity("error"),
      warnings: bySeverity("warning"),
      info: bySeverity("info"),
      fixed: fixed.length,
      opened: create.length,
      resolved: resolved.length,
      rules: Object.fromEntries([...new Set(findings.map((f) => f.rule))].map((r) => [r, findings.filter((f) => f.rule === r).length])),
    };
  }

  /**
   * The vehicle module's part of merging a configuration into another: its
   * catalog references move over, then it is deleted. Returns what
   * `unmergeVehicle` needs to undo it (the domain's workflow re-points
   * fitments and garage entries around this).
   */
  @InjectTransactionManager()
  async mergeVehicle(fromId: string, intoId: string, @MedusaContext() ctx: Context = {}) {
    if (fromId === intoId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A configuration can't be merged into itself.");
    await this.retrieveVehicle(intoId, { select: ["id"] }, ctx);
    const references = await this.listVehicleReferences({ vehicle_id: fromId }, { select: ["id"] }, ctx);
    if (references.length) await this.updateVehicleReferences(references.map((r) => ({ id: r.id, vehicle_id: intoId })) as any[], ctx);
    await this.softDeleteVehicles([fromId], {}, ctx);
    return { from: fromId, references: references.map((r) => r.id) };
  }

  @InjectTransactionManager()
  async unmergeVehicle(undo: { from: string; references: string[] }, @MedusaContext() ctx: Context = {}) {
    await this.restoreVehicles([undo.from], {}, ctx);
    if (undo.references.length) await this.updateVehicleReferences(undo.references.map((id) => ({ id, vehicle_id: undo.from })) as any[], ctx);
  }

  /** Closes a reviewed task with what was done (e.g. a merge run by the domain). */
  @InjectTransactionManager()
  async markTaskDone(taskId: string, result: Row, @MedusaContext() ctx: Context = {}) {
    const [task] = (await this.listCatalogTasks({ id: taskId }, { select: ["id", "report"] }, ctx)) as Row[];
    await this.updateCatalogTasks(
      [{ id: taskId, status: CatalogTaskStatus.DONE, next_run_at: null, report: { ...(task?.report ?? {}), approved_at: new Date().toISOString(), result } }] as any[],
      ctx,
    );
  }

  /** Merges an engine into another: its configurations move over (refused if one would collide), then it is deleted. */
  @InjectTransactionManager()
  async mergeEngines(fromId: string, intoId: string, @MedusaContext() ctx: Context = {}) {
    if (fromId === intoId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "An engine can't be merged into itself.");
    await this.retrieveVehicleEngine(intoId, {}, ctx);
    const vehicles = await this.listVehicles({ engine_id: fromId }, { select: ["id"] }, ctx);
    if (vehicles.length) await this.updateVehicles(vehicles.map((v) => ({ id: v.id, engine_id: intoId })) as any[], ctx);
    await this.softDeleteVehicleEngines([fromId], {}, ctx);
    return { moved: vehicles.length };
  }

  /** Merges a generation into another of the same model: its configurations move over (they must fit its years), then it is deleted. */
  @InjectTransactionManager()
  async mergeGenerations(fromId: string, intoId: string, @MedusaContext() ctx: Context = {}) {
    if (fromId === intoId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A generation can't be merged into itself.");
    const [from, into] = await Promise.all([
      this.retrieveVehicleGeneration(fromId, { select: ["id", "model_id"] }, ctx),
      this.retrieveVehicleGeneration(intoId, { select: ["id", "model_id"] }, ctx),
    ]);
    if (from.model_id !== into.model_id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only generations of the same model can be merged.");
    const vehicles = await this.listVehicles({ generation_id: fromId }, { select: ["id"] }, ctx);
    if (vehicles.length) {
      await this.updateVehicles(vehicles.map((v) => ({ id: v.id, generation_id: intoId })) as any[], ctx);
      await this.assertWithinGeneration(vehicles.map((v) => v.id), ctx);
    }
    await this.softDeleteVehicleGenerations([fromId], {}, ctx);
    return { moved: vehicles.length };
  }

  // ── Rules (called by the module's entity hooks) ────────────────────────────

  /** A configuration's production years must fall within its generation's. */
  @InjectManager()
  async assertWithinGeneration(ids: string[], @MedusaContext() ctx: Context = {}) {
    const rows = await this.listVehicles({ id: ids }, { relations: ["generation"] }, ctx);
    for (const v of rows as Row[]) {
      const g = v.generation;
      if (g && !inside(v as Range, g)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Production years must be within the generation's (${g.year_start}–${g.year_end ?? ""}).`,
        );
      }
    }
  }

  // ── Selector (Year / Make / Model / Generation / Vehicle) ──────────────────

  @InjectManager()
  async selectorMakes(@MedusaContext() ctx: Context = {}) {
    const rows = await this.listVehicleMakes({}, { select: ["id", "name", "slug", "logo"] }, ctx);
    return (rows as Row[]).sort(byName);
  }

  @InjectManager()
  async selectorModels(makeId: string, @MedusaContext() ctx: Context = {}) {
    const rows = await this.listVehicleModels(
      { make_id: makeId },
      { select: ["id", "name", "slug", "image", "category"] },
      ctx,
    );
    return (rows as Row[]).sort(byName);
  }

  /** A model's generations produced in `year` (all when not given), oldest first, labelled. */
  @InjectManager()
  async selectorGenerations(modelId: string, year?: number, @MedusaContext() ctx: Context = {}) {
    const rows = await this.listVehicleGenerations({ model_id: modelId }, { relations: GENERATION_RELATIONS }, ctx);
    return (rows as Row[])
      .filter((g) => covers(g as Range, year))
      .sort((a, b) => a.year_start - b.year_start)
      .map(({ model, ...g }) => ({
        ...pick(g, ["id", "name", "code", "year_start", "year_end", "image"]),
        label: entityLabel(VehicleGeneration, { ...g, model }),
      }));
  }

  /** A generation's configurations produced in `year` (all when not given), labelled. */
  @InjectManager()
  async selectorVehicles(generationId: string, year?: number, @MedusaContext() ctx: Context = {}) {
    const rows = await this.listVehicles({ generation_id: generationId }, { relations: VEHICLE_RELATIONS }, ctx);
    return (rows as Row[])
      .filter((v) => covers(v as Range, year))
      .map((v) => ({
        ...pick(v, ["id", "trim", "body_style", "doors", "drive", "transmission", "year_start", "year_end"]),
        label: entityLabel(Vehicle, v),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /** Labels of these vehicles by id (missing ids are left out). */
  @InjectManager()
  async vehicleLabels(ids: string[], @MedusaContext() ctx: Context = {}): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const rows = (await this.listVehicles({ id: ids }, { relations: VEHICLE_RELATIONS }, ctx)) as Row[];
    return Object.fromEntries(rows.map((v) => [v.id, entityLabel(Vehicle, v)]));
  }

  /** The vehicle's id, label and production years, or 404. */
  @InjectManager()
  async vehicleSummary(id: string, @MedusaContext() ctx: Context = {}): Promise<VehicleSummary> {
    const [v] = (await this.listVehicles({ id }, { relations: VEHICLE_RELATIONS }, ctx)) as Row[];
    if (!v) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Vehicle "${id}" not found`);
    return { id: v.id, label: entityLabel(Vehicle, v), year_start: v.year_start, year_end: v.year_end };
  }
}

function pick(row: Row, ...lists: readonly (readonly string[])[]) {
  const out: Row = {};
  for (const key of lists.flat()) if (!key.includes(".") && key in row) out[key] = row[key];
  return out;
}

/** The kinds a worker runs (cleanup findings wait for people). */
const STEWARD_KINDS = [
  CatalogTaskKind.RESEARCH_GENERATIONS,
  CatalogTaskKind.RESEARCH_CONFIGURATIONS,
  CatalogTaskKind.VERIFY_MODEL,
  CatalogTaskKind.VERIFY_GENERATION,
];

/** A worker's result for a leased task. */
export type TaskResultInput = {
  lease_token: string;
  /** The model that answered (recorded as the source), e.g. "qwen3.5:4b". */
  model?: string;
  /** A local model's raw answer, checked against `evidence`. */
  output?: unknown;
  /** The cloud agent's answer, already a catalog file. */
  file?: CatalogFile;
  /** The research agent's answer as it wrote it: `{ generations, sources, notes }`, JSON text or wrapped (see agentDraftFile). */
  answer?: unknown;
  /** The pages the answer is based on (for the quote checks). */
  evidence?: { url: string; text: string }[];
  notes?: string;
  /** The run failed (the task backs off). */
  error?: string;
  cost?: { usd?: number; credits?: number; steps?: number };
  sources?: string[];
  /** false: a first attempt; unless it applies, the task stays leased for a fallback to submit. */
  final?: boolean;
};

export type TaskResult = { status: CatalogTaskStatus; reason: string; report: Row; final?: boolean };

const pickGeneration = (g: Row): StewardGeneration => ({
  id: g.id,
  name: g.name,
  code: g.code,
  year_start: g.year_start,
  year_end: g.year_end,
  source_tier: g.source_tier,
});

/** A task's spend, accumulated over its runs. */
function addCost(current: Row | null | undefined, add: TaskResultInput["cost"], model?: string) {
  const c = current ?? {};
  return {
    usd: Math.round(((c.usd ?? 0) + (add?.usd ?? 0)) * 10_000) / 10_000,
    credits: (c.credits ?? 0) + (add?.credits ?? 0),
    steps: (c.steps ?? 0) + (add?.steps ?? 0),
    model: model ?? c.model ?? null,
  };
}

/** An agent's file, kept to the task: its make and model, and for a generation task that generation. */
function scopeFile(file: CatalogFile, ctx: StewardContext): CatalogFile | null {
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const model = file.makes.find((m) => same(m.name, ctx.make.name))?.models.find((m) => same(m.name, ctx.model.name));
  if (!model) return null;
  const generations =
    ctx.kind === CatalogTaskKind.RESEARCH_CONFIGURATIONS
      ? model.generations.filter((g) => same(g.name, ctx.generation!.name)).map((g) => ({ ...g, name: ctx.generation!.name }))
      : model.generations.map((g) => ({ ...g, vehicles: [] }));
  if (!generations.length) return null;
  return {
    ...file,
    source: { ...file.source, tier: SourceTier.RESEARCH },
    makes: [{ name: ctx.make.name, models: [{ name: ctx.model.name, category: ctx.model.category as any, generations }] }],
  };
}

const describeCorrection = (c: Correction) => `${c.ref}: ${c.field} ${c.from ?? "empty"} → ${c.to ?? "empty"} ("${c.quote}")`;
const countVehicles = (file: CatalogFile) =>
  file.makes.flatMap((m) => m.models.flatMap((mo) => mo.generations.flatMap((g) => [g, ...g.vehicles]))).length;
