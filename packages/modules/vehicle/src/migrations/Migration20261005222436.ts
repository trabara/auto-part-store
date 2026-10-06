import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005222436 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique";`);
    this.addSql(`create table if not exists "vehicle_engine" ("id" text not null, "fuel" text check ("fuel" in ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID')) not null default 'GASOLINE', "type" text check ("type" in ('I4', 'V4', 'V6', 'V8', 'ELECTRIC', 'HYBRID')) not null default 'ELECTRIC', "size" text not null default '1.0', "power" integer not null, "name" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_engine_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_engine_deleted_at" ON "vehicle_engine" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_engine_unique" ON "vehicle_engine" ("fuel", "type", "size", "power") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vehicle_make" ("id" text not null, "name" text not null, "slug" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_make_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_make_deleted_at" ON "vehicle_make" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_make_name_unique" ON "vehicle_make" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vehicle_model" ("id" text not null, "name" text not null, "slug" text null, "make_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_model_make_id" ON "vehicle_model" ("make_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_model_deleted_at" ON "vehicle_model" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_model_name_unique" ON "vehicle_model" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vehicle" ("id" text not null, "body_style" text check ("body_style" in ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'VAN', 'PICKUP')) not null default 'SEDAN', "doors" integer not null default 4, "drive" text check ("drive" in ('FWD', 'RWD', 'AWD', 'FOUR_WD')) not null default 'FWD', "transmission" text check ("transmission" in ('MANUAL', 'AUTOMATIC', 'CVT')) not null default 'MANUAL', "year_start" integer not null, "year_end" integer null, "model_id" text not null, "engine_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_pkey" primary key ("id"), constraint year_range_check check (year_end IS NULL OR year_end >= year_start));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_model_id" ON "vehicle" ("model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_engine_id" ON "vehicle" ("engine_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_deleted_at" ON "vehicle" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vehicle_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique" ON "vehicle" ("model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start", "year_end") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle_model" drop constraint if exists "vehicle_model_make_id_foreign";`);
    this.addSql(`alter table if exists "vehicle_model" add constraint "vehicle_model_make_id_foreign" foreign key ("make_id") references "vehicle_make" ("id") on update cascade;`);

    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_model_id_foreign";`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_model_id_foreign" foreign key ("model_id") references "vehicle_model" ("id") on update cascade;`);
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_engine_id_foreign";`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_engine_id_foreign" foreign key ("engine_id") references "vehicle_engine" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_engine_id_foreign";`);

    this.addSql(`alter table if exists "vehicle_model" drop constraint if exists "vehicle_model_make_id_foreign";`);

    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_model_id_foreign";`);

    this.addSql(`drop table if exists "vehicle_engine" cascade;`);

    this.addSql(`drop table if exists "vehicle_make" cascade;`);

    this.addSql(`drop table if exists "vehicle_model" cascade;`);

    this.addSql(`drop table if exists "vehicle" cascade;`);
  }

}
