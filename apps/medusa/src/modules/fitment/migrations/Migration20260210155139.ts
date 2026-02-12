import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260210155139 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_engine_id_unique";`);
    this.addSql(`create table if not exists "engine" ("id" text not null, "fuel" text check ("fuel" in ('gasoline', 'diesel', 'electric', 'hybrid')) not null default 'gasoline', "type" text check ("type" in ('I4', 'V4', 'V6', 'V8', 'Electric', 'Hybrid')) not null default 'I4', "size" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "engine_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_engine_deleted_at" ON "engine" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "make" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "make_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_make_deleted_at" ON "make" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "model" ("id" text not null, "name" text not null, "make_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_model_make_id" ON "model" ("make_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_model_deleted_at" ON "model" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment" ("id" text not null, "body_style" text check ("body_style" in ('sedan', 'suv', 'hatchback', 'coupe', 'convertible')) not null default 'sedan', "drive" text check ("drive" in ('fwd', 'rwd', 'awd')) not null default 'fwd', "transmission" text check ("transmission" in ('manual', 'automatic', 'cvt')) not null default 'manual', "year_start" integer not null, "year_end" integer not null, "model_id" text not null, "engine_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_pkey" primary key ("id"), constraint year_range_check check (year_end >= year_start));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_model_id" ON "fitment" ("model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_engine_id" ON "fitment" ("engine_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_deleted_at" ON "fitment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fitment_model_id_engine_id_unique" ON "fitment" ("model_id", "engine_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "model" add constraint "model_make_id_foreign" foreign key ("make_id") references "make" ("id") on update cascade;`);

    this.addSql(`alter table if exists "fitment" add constraint "fitment_model_id_foreign" foreign key ("model_id") references "model" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_engine_id_foreign" foreign key ("engine_id") references "engine" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_engine_id_foreign";`);

    this.addSql(`alter table if exists "model" drop constraint if exists "model_make_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_foreign";`);

    this.addSql(`drop table if exists "engine" cascade;`);

    this.addSql(`drop table if exists "make" cascade;`);

    this.addSql(`drop table if exists "model" cascade;`);

    this.addSql(`drop table if exists "fitment" cascade;`);
  }

}
