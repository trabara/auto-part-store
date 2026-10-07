import type { Context } from "@medusajs/framework/types";
import { InjectManager, InjectTransactionManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils";
import type { CustomerVehicle } from "../contract";
import { garageModels } from "./models/garage";

/** A garage vehicle as the storefront reads it (the domain adds the vehicle's label). */
export type GarageEntry = Pick<
  CustomerVehicle,
  "id" | "nickname" | "vin" | "registration" | "is_default" | "build_year" | "build_month" | "vehicle_id" | "created_at"
>;

const ENTRY_FIELDS: (keyof GarageEntry)[] = [
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

// Thin: loads, calls core rules, persists. Never resolves another module.
export default class GarageModuleService extends MedusaService(garageModels) {
  /** A customer's garage vehicles (optionally one), oldest first. */
  @InjectManager()
  async listGarage(customerId: string, id?: string, @MedusaContext() ctx: Context = {}): Promise<GarageEntry[]> {
    const rows = await this.listCustomerVehicles(
      { customer_id: customerId, ...(id ? { id } : {}) },
      { select: ENTRY_FIELDS, order: { created_at: "ASC" } },
      ctx,
    );
    return rows as unknown as GarageEntry[];
  }

  /** The customer's garage vehicle, or 404 (also when it belongs to someone else). */
  @InjectManager()
  async retrieveGarageVehicle(customerId: string, id: string, @MedusaContext() ctx: Context = {}): Promise<GarageEntry> {
    const [row] = await this.listGarage(customerId, id, ctx);
    if (!row) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Garage vehicle "${id}" not found`);
    return row;
  }

  // ── Rules (called by the module's entity hooks) ────────────────────────────

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
}
