import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005222435 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "automotive_attribute" ("id" text not null, "code" text not null, "name" text not null, "dataType" text check ("dataType" in ('string', 'number', 'boolean', 'date', 'enum', 'array', 'object')) not null, "defaultUnit" text null, "category" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "automotive_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_automotive_attribute_deleted_at" ON "automotive_attribute" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_position" ("id" text not null, "code" text not null, "name" text not null, "category" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_position_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_position_deleted_at" ON "fitment_position" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment" ("id" text not null, "notes" text null, "position_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_position_id" ON "fitment" ("position_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_deleted_at" ON "fitment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_condition_group" ("id" text not null, "operator" text check ("operator" in ('and', 'or')) not null, "fitment_id" text not null, "parent_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_condition_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_fitment_id" ON "fitment_condition_group" ("fitment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_parent_id" ON "fitment_condition_group" ("parent_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_deleted_at" ON "fitment_condition_group" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_condition" ("id" text not null, "operator" text check ("operator" in ('eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in')) not null, "value" text not null, "valueTo" text null, "unit" text null, "group_id" text not null, "attribute_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_condition_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_group_id" ON "fitment_condition" ("group_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_attribute_id" ON "fitment_condition" ("attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_condition_deleted_at" ON "fitment_condition" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_position_id_foreign";`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_position_id_foreign" foreign key ("position_id") references "fitment_position" ("id") on update cascade;`);

    this.addSql(`alter table if exists "fitment_condition_group" drop constraint if exists "fitment_condition_group_fitment_id_foreign";`);
    this.addSql(`alter table if exists "fitment_condition_group" add constraint "fitment_condition_group_fitment_id_foreign" foreign key ("fitment_id") references "fitment" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment_condition_group" drop constraint if exists "fitment_condition_group_parent_id_foreign";`);
    this.addSql(`alter table if exists "fitment_condition_group" add constraint "fitment_condition_group_parent_id_foreign" foreign key ("parent_id") references "fitment_condition_group" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "fitment_condition" drop constraint if exists "fitment_condition_group_id_foreign";`);
    this.addSql(`alter table if exists "fitment_condition" add constraint "fitment_condition_group_id_foreign" foreign key ("group_id") references "fitment_condition_group" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment_condition" drop constraint if exists "fitment_condition_attribute_id_foreign";`);
    this.addSql(`alter table if exists "fitment_condition" add constraint "fitment_condition_attribute_id_foreign" foreign key ("attribute_id") references "automotive_attribute" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment_condition" drop constraint if exists "fitment_condition_attribute_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_position_id_foreign";`);

    this.addSql(`alter table if exists "fitment_condition_group" drop constraint if exists "fitment_condition_group_fitment_id_foreign";`);

    this.addSql(`alter table if exists "fitment_condition_group" drop constraint if exists "fitment_condition_group_parent_id_foreign";`);

    this.addSql(`alter table if exists "fitment_condition" drop constraint if exists "fitment_condition_group_id_foreign";`);

    this.addSql(`drop table if exists "automotive_attribute" cascade;`);

    this.addSql(`drop table if exists "fitment_position" cascade;`);

    this.addSql(`drop table if exists "fitment" cascade;`);

    this.addSql(`drop table if exists "fitment_condition_group" cascade;`);

    this.addSql(`drop table if exists "fitment_condition" cascade;`);
  }

}
