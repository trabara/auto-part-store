import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212210713 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_engine_id_foreign";`);

    this.addSql(`alter table if exists "model" drop constraint if exists "model_make_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_foreign";`);

    this.addSql(`create table if not exists "fitment_engine" ("id" text not null, "fuel" text check ("fuel" in ('gasoline', 'diesel', 'electric', 'hybrid')) not null default 'gasoline', "type" text check ("type" in ('I4', 'V4', 'V6', 'V8', 'Electric', 'Hybrid')) not null default 'I4', "size" text not null default '1.0', "tech" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_engine_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_engine_deleted_at" ON "fitment_engine" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_make" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_make_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_make_deleted_at" ON "fitment_make" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_model" ("id" text not null, "name" text not null, "make_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_model_make_id" ON "fitment_model" ("make_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_model_deleted_at" ON "fitment_model" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "fitment_model" add constraint "fitment_model_make_id_foreign" foreign key ("make_id") references "fitment_make" ("id") on update cascade;`);

    this.addSql(`drop table if exists "engine" cascade;`);

    this.addSql(`drop table if exists "make" cascade;`);

    this.addSql(`drop table if exists "model" cascade;`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_foreign";`);
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_engine_id_foreign";`);

    this.addSql(`alter table if exists "fitment" add constraint "fitment_model_id_foreign" foreign key ("model_id") references "fitment_model" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_engine_id_foreign" foreign key ("engine_id") references "fitment_engine" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_engine_id_foreign";`);

    this.addSql(`alter table if exists "fitment_model" drop constraint if exists "fitment_model_make_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_foreign";`);

    this.addSql(`create table if not exists "engine" ("id" text not null, "fuel" text check ("fuel" in ('gasoline', 'diesel', 'electric', 'hybrid')) not null default 'gasoline', "type" text check ("type" in ('I4', 'V4', 'V6', 'V8', 'Electric', 'Hybrid')) not null default 'I4', "size" text not null default '1.0', "tech" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "engine_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_engine_deleted_at" ON "engine" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "make" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "make_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_make_deleted_at" ON "make" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "model" ("id" text not null, "name" text not null, "make_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_model_make_id" ON "model" ("make_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_model_deleted_at" ON "model" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "model" add constraint "model_make_id_foreign" foreign key ("make_id") references "make" ("id") on update cascade;`);

    this.addSql(`drop table if exists "fitment_engine" cascade;`);

    this.addSql(`drop table if exists "fitment_make" cascade;`);

    this.addSql(`drop table if exists "fitment_model" cascade;`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_foreign";`);
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_engine_id_foreign";`);

    this.addSql(`alter table if exists "fitment" add constraint "fitment_model_id_foreign" foreign key ("model_id") references "model" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_engine_id_foreign" foreign key ("engine_id") references "engine" ("id") on update cascade;`);
  }

}
