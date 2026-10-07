import type { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";
import { entityLabel } from "@repo/framework/entity";
import { Vehicle, VehicleGeneration } from "../contract";
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

export default class VehicleModuleService extends MedusaService(vehicleModels) {
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
