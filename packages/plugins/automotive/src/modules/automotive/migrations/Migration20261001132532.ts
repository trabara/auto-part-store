import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261001132532 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique";`);
    this.addSql(`create table if not exists "automotive_attribute" ("id" text not null, "code" text not null, "name" text not null, "dataType" text check ("dataType" in ('string', 'number', 'boolean', 'date', 'enum', 'array', 'object')) not null, "defaultUnit" text null, "category" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "automotive_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_automotive_attribute_deleted_at" ON "automotive_attribute" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_position" ("id" text not null, "code" text not null, "name" text not null, "category" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_position_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_position_deleted_at" ON "fitment_position" ("deleted_at") WHERE deleted_at IS NULL;`);

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

    this.addSql(`create table if not exists "vehicle" ("id" text not null, "body_style" text check ("body_style" in ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'VAN', 'PICKUP')) not null default 'SEDAN', "doors" integer not null default 4, "drive" text check ("drive" in ('FWD', 'RWD', 'AWD', 'FOUR_WD')) not null default 'FWD', "transmission" text check ("transmission" in ('MANUAL', 'AUTOMATIC', 'CVT')) not null default 'MANUAL', "year_start" integer not null, "year_end" integer null, "model_id" text not null, "engine_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_model_id" ON "vehicle" ("model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_engine_id" ON "vehicle" ("engine_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_deleted_at" ON "vehicle" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vehicle_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique" ON "vehicle" ("model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start", "year_end") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment" ("id" text not null, "vehicle_id" text not null, "position_id" text not null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_vehicle_id" ON "fitment" ("vehicle_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_position_id" ON "fitment" ("position_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_deleted_at" ON "fitment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_condition_group" ("id" text not null, "operator" text check ("operator" in ('and', 'or')) not null, "fitment_id" text not null, "parent_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_condition_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_fitment_id" ON "fitment_condition_group" ("fitment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_parent_id" ON "fitment_condition_group" ("parent_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_deleted_at" ON "fitment_condition_group" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_condition" ("id" text not null, "group_id" text not null, "attribute_id" text not null, "operator" text check ("operator" in ('eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in')) not null, "value" text not null, "valueTo" text null, "unit" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_condition_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_id" ON "fitment_condition" ("group_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_attribute_id" ON "fitment_condition" ("attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_deleted_at" ON "fitment_condition" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle_model" add constraint "vehicle_model_make_id_foreign" foreign key ("make_id") references "vehicle_make" ("id") on update cascade;`);

    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_model_id_foreign" foreign key ("model_id") references "vehicle_model" ("id") on update cascade;`);
    this.addSql(`alter table if exists "vehicle" add constraint "vehicle_engine_id_foreign" foreign key ("engine_id") references "vehicle_engine" ("id") on update cascade;`);

    this.addSql(`alter table if exists "fitment" add constraint "fitment_vehicle_id_foreign" foreign key ("vehicle_id") references "vehicle" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_position_id_foreign" foreign key ("position_id") references "fitment_position" ("id") on update cascade;`);

    this.addSql(`alter table if exists "fitment_condition_group" add constraint "fitment_condition_group_fitment_id_foreign" foreign key ("fitment_id") references "fitment" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment_condition_group" add constraint "fitment_condition_group_parent_id_foreign" foreign key ("parent_id") references "fitment_condition_group" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "fitment_condition" add constraint "fitment_condition_group_id_foreign" foreign key ("group_id") references "fitment_condition_group" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment_condition" add constraint "fitment_condition_attribute_id_foreign" foreign key ("attribute_id") references "automotive_attribute" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment_condition" drop constraint if exists "fitment_condition_attribute_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_position_id_foreign";`);

    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_engine_id_foreign";`);

    this.addSql(`alter table if exists "vehicle_model" drop constraint if exists "vehicle_model_make_id_foreign";`);

    this.addSql(`alter table if exists "vehicle" drop constraint if exists "vehicle_model_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_vehicle_id_foreign";`);

    this.addSql(`alter table if exists "fitment_condition_group" drop constraint if exists "fitment_condition_group_fitment_id_foreign";`);

    this.addSql(`alter table if exists "fitment_condition_group" drop constraint if exists "fitment_condition_group_parent_id_foreign";`);

    this.addSql(`alter table if exists "fitment_condition" drop constraint if exists "fitment_condition_group_id_foreign";`);

    this.addSql(`drop table if exists "automotive_attribute" cascade;`);

    this.addSql(`drop table if exists "fitment_position" cascade;`);

    this.addSql(`drop table if exists "vehicle_engine" cascade;`);

    this.addSql(`drop table if exists "vehicle_make" cascade;`);

    this.addSql(`drop table if exists "vehicle_model" cascade;`);

    this.addSql(`drop table if exists "vehicle" cascade;`);

    this.addSql(`drop table if exists "fitment" cascade;`);

    this.addSql(`drop table if exists "fitment_condition_group" cascade;`);

    this.addSql(`drop table if exists "fitment_condition" cascade;`);
  }

}
