import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006084343 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_engine" alter column "type" drop default;`);
    this.addSql(`alter table if exists "vehicle_engine" alter column "type" type text using ("type"::text);`);
    this.addSql(`alter table if exists "vehicle_engine" alter column "size" drop default;`);
    this.addSql(`alter table if exists "vehicle_engine" alter column "size" type text using ("size"::text);`);

    this.addSql(`drop index if exists "vehicle_model_name_unique";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_model_make_name_unique" ON "vehicle_model" ("make_id", "name") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_vehicle_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_configuration_unique" ON "vehicle" ("model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start", "year_end") WHERE year_end IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_configuration_open_unique" ON "vehicle" ("model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start") WHERE year_end IS NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_engine" alter column "type" type text using ("type"::text);`);
    this.addSql(`alter table if exists "vehicle_engine" alter column "type" set default 'ELECTRIC';`);
    this.addSql(`alter table if exists "vehicle_engine" alter column "size" type text using ("size"::text);`);
    this.addSql(`alter table if exists "vehicle_engine" alter column "size" set default '1.0';`);

    this.addSql(`drop index if exists "vehicle_model_make_name_unique";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_model_name_unique" ON "vehicle_model" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "vehicle_configuration_unique";`);
    this.addSql(`drop index if exists "vehicle_configuration_open_unique";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vehicle_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique" ON "vehicle" ("model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start", "year_end") WHERE deleted_at IS NULL;`);
  }

}
