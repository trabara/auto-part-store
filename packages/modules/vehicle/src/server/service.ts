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
  type CatalogFile,
  type CatalogImportMode,
  type CatalogImportReport,
} from "../contract";
import {
  catalogCoverage,
  planCatalog,
  recordsToCatalog,
  researchTasks,
  toCatalogVehicle,
  validateCatalog,
  type CatalogRecords,
  type CatalogRef,
  type CatalogSnapshot,
  type ModelCoverage,
  type ResearchTask,
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
   * has none (`fill`), or written (`overwrite`, for reviewed files). Nothing is
   * written with `dryRun` or when the file has problems.
   */
  @InjectTransactionManager()
  async importCatalog(
    file: CatalogFile,
    options: { dryRun?: boolean; mode?: CatalogImportMode } = {},
    @MedusaContext() ctx: Context = {},
  ): Promise<CatalogImportReport> {
    const mode = options.mode ?? "create";
    const plan = planCatalog(file, await this.catalogSnapshot_(file, ctx), { mode });
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
    };
    if (problems.length || options.dryRun) return report;

    const update = (entity: string) => plan.updates.filter((u) => u.entity === entity).map((u) => ({ id: u.id, ...u.data }));
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
      const rows = plan.makes.map((m) => asCreated(VehicleMake, { name: m.data.name, slug: m.data.name, logo: null }));
      remember(plan.makes.map((m) => m.key), await this.createVehicleMakes(rows as any[], ctx));
    }
    if (plan.models.length) {
      const rows = plan.models.map((m) =>
        asCreated(VehicleModel, { ...m.data, slug: m.data.name, image: null, make_id: id(m.make) }),
      );
      remember(plan.models.map((m) => m.key), await this.createVehicleModels(rows as any[], ctx));
    }
    if (plan.generations.length) {
      const rows = plan.generations.map((g) => asCreated(VehicleGeneration, { ...g.data, image: null, model_id: id(g.model) }));
      remember(plan.generations.map((g) => g.key), await this.createVehicleGenerations(rows as any[], ctx));
    }
    if (plan.engines.length) {
      const rows = plan.engines.map((e) => asCreated(VehicleEngine, e.data));
      remember(plan.engines.map((e) => e.key), await this.createVehicleEngines(rows as any[], ctx));
    }
    if (plan.vehicles.length) {
      const rows = plan.vehicles.map((v) =>
        asCreated(Vehicle, { ...v.data, generation_id: id(v.generation), engine_id: id(v.engine) }),
      );
      const created = await this.createVehicles(rows as any[], ctx);
      remember(plan.vehicles.map((v) => v.key), created);
      created.forEach((v) => checked.add(v.id));
    }
    if (plan.references.length) {
      const rows = plan.references.map((r) => asCreated(VehicleReference, { ...r.data, vehicle_id: id(r.vehicle) }));
      await this.createVehicleReferences(rows as any[], ctx);
    }
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

  /** The existing records a catalog file can match (its makes' subtree, its engines' powers, its references). */
  @InjectManager()
  protected async catalogSnapshot_(file: CatalogFile, @MedusaContext() ctx: Context = {}): Promise<CatalogSnapshot> {
    const names = new Set(file.makes.map((m) => m.name.trim().toLowerCase()));
    const makes = (await this.listVehicleMakes({}, { select: ["id", "name"] }, ctx)).filter((m) =>
      names.has(m.name.trim().toLowerCase()),
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
    const vehiclesIn = file.makes.flatMap((m) => m.models.flatMap((mo) => mo.generations.flatMap((g) => g.vehicles)));
    const powers = [...new Set(vehiclesIn.map((v) => v.engine.power_kw))];
    const engines = powers.length
      ? await this.listVehicleEngines(
          { power_kw: powers },
          { select: ["id", "code", "fuel", "layout", "cylinders", "displacement_cc", "power_kw"] },
          ctx,
        )
      : [];
    const vehicles = generations.length
      ? await this.listVehicles(
          { generation_id: generations.map((g) => g.id) },
          {
            select: ["id", "generation_id", "engine_id", "body_style", "drive", "transmission", "trim", "year_start", "year_end", "doors"],
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
