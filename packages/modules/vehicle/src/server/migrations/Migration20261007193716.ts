import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261007193716 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "catalog_task" ("id" text not null, "kind" text check ("kind" in ('RESEARCH_GENERATIONS', 'RESEARCH_CONFIGURATIONS', 'VERIFY_MODEL', 'VERIFY_GENERATION', 'CLEANUP')) not null default 'RESEARCH_CONFIGURATIONS', "key" text not null, "entity" text check ("entity" in ('VehicleMake', 'VehicleModel', 'VehicleGeneration', 'VehicleEngine', 'Vehicle', 'VehicleReference')) null, "record_id" text null, "make" text null, "model" text null, "generation" text null, "status" text check ("status" in ('PENDING', 'RUNNING', 'APPLIED', 'REVIEW', 'NO_DATA', 'FAILED', 'DONE')) not null default 'PENDING', "priority" integer not null default 0, "attempts" integer not null default 0, "next_run_at" timestamptz null, "last_run_at" timestamptz null, "lease_until" timestamptz null, "lease_token" text null, "attention" boolean not null default false, "rule" text null, "finding" jsonb null default 'null', "sources" text[] not null default '{}', "report" jsonb null default 'null', "proposal" jsonb null default 'null', "cost" jsonb null default 'null', "feedback" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "catalog_task_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_task_deleted_at" ON "catalog_task" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "catalog_task_unique" ON "catalog_task" ("kind", "key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "catalog_task_queue" ON "catalog_task" ("status", "next_run_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle_engine" add column if not exists "source_tier" text check ("source_tier" in ('DRAFT', 'RESEARCH', 'REFERENCE', 'LICENSED', 'HUMAN')) not null default 'DRAFT', add column if not exists "sources" jsonb not null default '[]', add column if not exists "verified_at" timestamptz null;`);

    this.addSql(`alter table if exists "vehicle_make" add column if not exists "source_tier" text check ("source_tier" in ('DRAFT', 'RESEARCH', 'REFERENCE', 'LICENSED', 'HUMAN')) not null default 'DRAFT', add column if not exists "sources" jsonb not null default '[]', add column if not exists "verified_at" timestamptz null;`);

    this.addSql(`alter table if exists "vehicle_model" add column if not exists "on_sale_new" boolean not null default false, add column if not exists "source_tier" text check ("source_tier" in ('DRAFT', 'RESEARCH', 'REFERENCE', 'LICENSED', 'HUMAN')) not null default 'DRAFT', add column if not exists "sources" jsonb not null default '[]', add column if not exists "verified_at" timestamptz null;`);

    this.addSql(`alter table if exists "vehicle_generation" add column if not exists "source_tier" text check ("source_tier" in ('DRAFT', 'RESEARCH', 'REFERENCE', 'LICENSED', 'HUMAN')) not null default 'DRAFT', add column if not exists "sources" jsonb not null default '[]', add column if not exists "verified_at" timestamptz null;`);

    this.addSql(`alter table if exists "vehicle" add column if not exists "source_tier" text check ("source_tier" in ('DRAFT', 'RESEARCH', 'REFERENCE', 'LICENSED', 'HUMAN')) not null default 'DRAFT', add column if not exists "sources" jsonb not null default '[]', add column if not exists "verified_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "catalog_task" cascade;`);

    this.addSql(`alter table if exists "vehicle_engine" drop column if exists "source_tier", drop column if exists "sources", drop column if exists "verified_at";`);

    this.addSql(`alter table if exists "vehicle_make" drop column if exists "source_tier", drop column if exists "sources", drop column if exists "verified_at";`);

    this.addSql(`alter table if exists "vehicle_model" drop column if exists "on_sale_new", drop column if exists "source_tier", drop column if exists "sources", drop column if exists "verified_at";`);

    this.addSql(`alter table if exists "vehicle_generation" drop column if exists "source_tier", drop column if exists "sources", drop column if exists "verified_at";`);

    this.addSql(`alter table if exists "vehicle" drop column if exists "source_tier", drop column if exists "sources", drop column if exists "verified_at";`);
  }

}
