import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * Fitment → Vehicle became a module link (see src/links/fitment-vehicle.ts).
 * Drops the column left by the former single `automotive` module.
 */
export class Migration20261005222500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_vehicle_id_foreign";`);
    this.addSql(`drop index if exists "IDX_fitment_vehicle_id";`);
    this.addSql(`alter table if exists "fitment" drop column if exists "vehicle_id";`);
  }

  override async down(): Promise<void> {
    // The vehicle now lives in another module; the column is not restored.
  }
}
