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
  type CatalogImportReport,
} from "../contract";
import { planCatalog, validateCatalog, type CatalogRef, type CatalogSnapshot } from "../core";
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
const GARAGE_RELATIONS = relationsOf(Vehicle.label.fields, "vehicle.");

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/** A garage vehicle as the storefront sees it. */
export type GarageVehicle = {
  id: string;
  nickname: string | null;
  vin: string | null;
  registration: string | null;
  is_default: boolean;
  build_year: number | null;
  build_month: number | null;
  vehicle_id: string;
  created_at: Date;
  vehicle_label: string | null;
};

export type VehicleSummary = { id: string; label: string; year_start: number; year_end: number | null };

/** A row as the API would store it: parsed by the entity's create DTO, derived fields computed. */
const asCreated = (entity: EntityDef<any, any, any>, row: Row): Row => withDerived(entity, entity.dto.create.parse(row));

export default class VehicleModuleService extends MedusaService(vehicleModels) {
  // ── Catalog import ──────────────────────────────────────────────────────────

  /**
   * Imports a catalog file (`vehicle-catalog@1`) in one transaction: creates
   * the makes, models, generations, engines, configurations and references it
   * lacks, matched by natural key; never overwrites existing records (their
   * differences are reported). Nothing is written with `dryRun` or when the
   * file has problems.
   */
  @InjectTransactionManager()
  async importCatalog(
    file: CatalogFile,
    options: { dryRun?: boolean } = {},
    @MedusaContext() ctx: Context = {},
  ): Promise<CatalogImportReport> {
    const plan = planCatalog(file, await this.catalogSnapshot_(file, ctx));
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
      differences: plan.differences,
    };
    if (problems.length || options.dryRun) return report;

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
      remember(plan.vehicles.map((v) => v.key), await this.createVehicles(rows as any[], ctx));
    }
    if (plan.references.length) {
      const rows = plan.references.map((r) => asCreated(VehicleReference, { ...r.data, vehicle_id: id(r.vehicle) }));
      await this.createVehicleReferences(rows as any[], ctx);
    }
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

  /**
   * One default garage vehicle per customer: making `ids` the default clears
   * it on the customer's others. Returns the cleared ids (see `restoreDefaults`).
   */
  @InjectTransactionManager()
  async clearOtherDefaults(ids: string[], @MedusaContext() ctx: Context = {}): Promise<string[]> {
    const cleared: string[] = [];
    for (const id of ids) {
      const [current] = await this.listCustomerVehicles({ id }, { select: ["customer_id"] }, ctx);
      if (!current) continue;
      const others = await this.listCustomerVehicles(
        { customer_id: current.customer_id, is_default: true, id: { $ne: id } },
        { select: ["id"] },
        ctx,
      );
      if (others.length) {
        await this.updateCustomerVehicles(others.map((o) => ({ id: o.id, is_default: false })), ctx);
        cleared.push(...others.map((o) => o.id));
      }
    }
    return cleared;
  }

  @InjectTransactionManager()
  async restoreDefaults(ids: string[], @MedusaContext() ctx: Context = {}) {
    if (ids.length) await this.updateCustomerVehicles(ids.map((id) => ({ id, is_default: true })), ctx);
  }

  // ── Garage ─────────────────────────────────────────────────────────────────

  /** A customer's garage vehicles (optionally one), each with its vehicle label. */
  @InjectManager()
  async listGarage(customerId: string, id?: string, @MedusaContext() ctx: Context = {}): Promise<GarageVehicle[]> {
    const rows = await this.listCustomerVehicles(
      { customer_id: customerId, ...(id ? { id } : {}) },
      { relations: GARAGE_RELATIONS, order: { created_at: "ASC" } },
      ctx,
    );
    return (rows as Row[]).map(({ vehicle, ...row }) => ({
      ...(pick(row, GARAGE_FIELDS) as Omit<GarageVehicle, "vehicle_label">),
      vehicle_label: vehicle ? entityLabel(Vehicle, vehicle) : null,
    }));
  }

  /** The customer's garage vehicle, or 404 (also when it belongs to someone else). */
  @InjectManager()
  async retrieveGarageVehicle(customerId: string, id: string, @MedusaContext() ctx: Context = {}): Promise<GarageVehicle> {
    const [row] = await this.listGarage(customerId, id, ctx);
    if (!row) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Garage vehicle "${id}" not found`);
    return row;
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

  /** The vehicle's id, label and production years, or 404. */
  @InjectManager()
  async vehicleSummary(id: string, @MedusaContext() ctx: Context = {}): Promise<VehicleSummary> {
    const [v] = (await this.listVehicles({ id }, { relations: VEHICLE_RELATIONS }, ctx)) as Row[];
    if (!v) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Vehicle "${id}" not found`);
    return { id: v.id, label: entityLabel(Vehicle, v), year_start: v.year_start, year_end: v.year_end };
  }
}

const GARAGE_FIELDS = [
  "id",
  "nickname",
  "vin",
  "registration",
  "is_default",
  "build_year",
  "build_month",
  "vehicle_id",
  "created_at",
];

function pick(row: Row, ...lists: readonly (readonly string[])[]) {
  const out: Row = {};
  for (const key of lists.flat()) if (!key.includes(".") && key in row) out[key] = row[key];
  return out;
}
