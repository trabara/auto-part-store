import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// customer_vehicle moved to the garage module (its migrations create it).
export class Migration20261006104728 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vehicle_generation" ("id" text not null, "name" text not null, "code" text null, "year_start" integer not null, "year_end" integer null, "image" text null, "model_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_generation_pkey" primary key ("id"), constraint vehicle_generation_year_range_check check (year_end IS NULL OR year_end >= year_start), constraint vehicle_generation_year_bounds_check check (year_start BETWEEN 1886 AND 2100));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_generation_model_id" ON "vehicle_generation" ("model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_generation_deleted_at" ON "vehicle_generation" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_generation_unique" ON "vehicle_generation" ("model_id", "name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vehicle_reference" ("id" text not null, "source" text check ("source" in ('TECDOC_KTYPE', 'ACES_VEHICLE_ID', 'ACES_BASE_VEHICLE', 'OTHER')) not null, "external_id" text not null, "vehicle_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_reference_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_reference_vehicle_id" ON "vehicle_reference" ("vehicle_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_reference_deleted_at" ON "vehicle_reference" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_reference_unique" ON "vehicle_reference" ("source", "external_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle_generation" add constraint "vehicle_generation_model_id_foreign" foreign key ("model_id") references "vehicle_model" ("id") on update cascade;`);

    this.addSql(`alter table if exists "vehicle_reference" add constraint "vehicle_reference_vehicle_id_foreign" foreign key ("vehicle_id") references "vehicle" ("id") on update cascade;`);

    // ── Hand-written from here: existing data is converted, not renamed. ──

    // Engines: hp → kW (hp kept, derived), litres → cm³, type → layout + cylinders.
    this.addSql(`drop index if exists "vehicle_engine_unique";`);
    this.addSql(`alter table if exists "vehicle_engine" drop constraint if exists "vehicle_engine_fuel_check";`);
    this.addSql(`alter table if exists "vehicle_engine" add column if not exists "code" text null, add column if not exists "layout" text check ("layout" in ('INLINE', 'V', 'BOXER', 'W', 'ROTARY', 'ELECTRIC_MOTOR')) null, add column if not exists "cylinders" integer null, add column if not exists "displacement_cc" integer null, add column if not exists "power_kw" integer null, add column if not exists "power_hp" integer null;`);
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_engine' AND column_name = 'power') THEN
          UPDATE "vehicle_engine" SET
            "power_hp" = "power",
            "power_kw" = GREATEST(1, round("power" / 1.34102)),
            "displacement_cc" = CASE
              WHEN "type" <> 'ELECTRIC' AND "size" ~ '^[0-9]+(\.[0-9]+)?$' AND "size"::numeric > 0
              THEN round("size"::numeric * 1000) END,
            "layout" = CASE "type"
              WHEN 'I4' THEN 'INLINE' WHEN 'HYBRID' THEN 'INLINE'
              WHEN 'V4' THEN 'V' WHEN 'V6' THEN 'V' WHEN 'V8' THEN 'V'
              WHEN 'ELECTRIC' THEN 'ELECTRIC_MOTOR' END,
            "cylinders" = CASE "type"
              WHEN 'I4' THEN 4 WHEN 'HYBRID' THEN 4 WHEN 'V4' THEN 4 WHEN 'V6' THEN 6 WHEN 'V8' THEN 8 END,
            "fuel" = CASE
              WHEN "type" = 'ELECTRIC' THEN 'ELECTRIC'
              WHEN "type" = 'HYBRID' AND "fuel" = 'GASOLINE' THEN 'HYBRID'
              ELSE "fuel" END;
          ALTER TABLE "vehicle_engine" DROP COLUMN "power", DROP COLUMN "type", DROP COLUMN "size";
        END IF;
      END $$;
    `);
    this.addSql(`alter table if exists "vehicle_engine" alter column "power_kw" set not null, alter column "power_hp" set not null;`);
    this.addSql(`alter table if exists "vehicle_engine" add constraint "vehicle_engine_fuel_check" check("fuel" in ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG_IN_HYBRID', 'LPG', 'CNG', 'HYDROGEN'));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_engine_unique" ON "vehicle_engine" ("fuel", "layout", "cylinders", "displacement_cc", "power_kw", "code") NULLS NOT DISTINCT WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle_model" add column if not exists "category" text check ("category" in ('CAR', 'LCV', 'TRUCK', 'MOTORCYCLE')) not null default 'CAR';`);

    // Vehicles: model → generation. Each model with vehicles gets an
    // "All years" generation covering them.
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_body_style_check";`);
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_transmission_check";`);
    this.addSql(`drop index if exists "vehicle_configuration_unique";`);
    this.addSql(`drop index if exists "vehicle_configuration_open_unique";`);
    this.addSql(`alter table if exists "vehicle" drop constraint if exists year_range_check;`);
    this.addSql(`alter table if exists "vehicle" drop constraint if exists year_bounds_check;`);
    this.addSql(`alter table if exists "vehicle" add column if not exists "trim" text null, add column if not exists "generation_id" text null;`);
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle' AND column_name = 'model_id') THEN
          INSERT INTO "vehicle_generation" ("id", "name", "model_id", "year_start", "year_end")
          SELECT 'vgen_' || substr(md5(random()::text || m."model_id"), 1, 26), 'All years', m."model_id", m.ys, m.ye
          FROM (
            SELECT "model_id", min("year_start") AS ys,
                   CASE WHEN bool_or("year_end" IS NULL) THEN NULL ELSE max("year_end") END AS ye
            FROM "vehicle" GROUP BY "model_id"
          ) m;
          UPDATE "vehicle" v SET "generation_id" = g."id"
          FROM "vehicle_generation" g
          WHERE g."model_id" = v."model_id" AND g."name" = 'All years' AND v."generation_id" IS NULL;
          ALTER TABLE "vehicle" DROP CONSTRAINT IF EXISTS "vehicle_model_id_foreign";
          DROP INDEX IF EXISTS "IDX_vehicle_model_id";
          ALTER TABLE "vehicle" DROP COLUMN "model_id";
        END IF;
      END $$;
    `);
    this.addSql(`alter table if exists "vehicle" alter column "generation_id" set not null;`);
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_generation_id_foreign";`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_generation_id_foreign" foreign key ("generation_id") references "vehicle_generation" ("id") on update cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_generation_id" ON "vehicle" ("generation_id") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_body_style_check" check("body_style" in ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'MINIVAN', 'VAN', 'PICKUP', 'CHASSIS_CAB', 'MOTORCYCLE'));`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_transmission_check" check("transmission" in ('MANUAL', 'AUTOMATIC', 'DUAL_CLUTCH', 'CVT'));`);
    this.addSql(`alter table if exists "vehicle" add constraint vehicle_year_range_check check(year_end IS NULL OR year_end >= year_start);`);
    this.addSql(`alter table if exists "vehicle" add constraint vehicle_year_bounds_check check(year_start BETWEEN 1886 AND 2100);`);

    // Configurations with the same specifications can't overlap in years.
    this.addSql(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_configuration_overlap";`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_configuration_overlap" exclude using gist ("generation_id" with =, "engine_id" with =, "body_style" with =, "doors" with =, "drive" with =, "transmission" with =, (coalesce("trim", '')) with =, int4range("year_start", coalesce("year_end", 2100), '[]') with &&) where ("deleted_at" is null);`);
  }

  override async down(): Promise<void> {
    // Data was converted (model → generation, hp → kW, litres → cm³): not
    // reversible. Drops only what this migration added.
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_configuration_overlap";`);
    this.addSql(`drop table if exists "vehicle_reference" cascade;`);
  }

}
