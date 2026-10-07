import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261007152935 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "customer_vehicle" ("id" text not null, "nickname" text null, "vin" text null, "registration" text null, "is_default" boolean not null default false, "build_year" integer null, "build_month" integer null, "customer_id" text not null, "vehicle_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_vehicle_pkey" primary key ("id"), constraint customer_vehicle_build_month_check check (build_month IS NULL OR build_year IS NOT NULL));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_vehicle_customer_id" ON "customer_vehicle" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_vehicle_vehicle_id" ON "customer_vehicle" ("vehicle_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_vehicle_deleted_at" ON "customer_vehicle" ("deleted_at") WHERE deleted_at IS NULL;`);

    // ── Hand-written: databases where the vehicle module created the table. ──
    // The vehicle is now a column link (another module): no foreign key.
    this.addSql(`alter table if exists "customer_vehicle" drop constraint if exists "customer_vehicle_vehicle_id_foreign";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "customer_vehicle" cascade;`);
  }

}
