import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260214172914 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique";`);
    this.addSql(`create table if not exists "fitment_engine" ("id" text not null, "fuel" text check ("fuel" in ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID')) not null default 'gasoline', "type" text check ("type" in ('I4', 'V4', 'V6', 'V8', 'ELECTRIC', 'HYBRID')) not null default 'I4', "size" text not null default '1.0', "tech" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_engine_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_engine_deleted_at" ON "fitment_engine" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_make" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_make_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_make_deleted_at" ON "fitment_make" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "fitment_make_name_unique" ON "fitment_make" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment_model" ("id" text not null, "name" text not null, "make_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_model_make_id" ON "fitment_model" ("make_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_model_deleted_at" ON "fitment_model" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "fitment_model_name_unique" ON "fitment_model" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fitment" ("id" text not null, "body_style" text check ("body_style" in ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'VAN', 'PICKUP')) not null default 'SEDAN', "doors" integer not null default 4, "drive" text check ("drive" in ('FWD', 'RWD', 'AWD', 'FOUR_WD')) not null default 'FWD', "transmission" text check ("transmission" in ('MANUAL', 'AUTOMATIC', 'CVT')) not null default 'MANUAL', "year_start" integer not null, "year_end" integer not null, "model_id" text not null, "engine_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_pkey" primary key ("id"), constraint year_range_check check (year_end >= year_start));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_model_id" ON "fitment" ("model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_engine_id" ON "fitment" ("engine_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_deleted_at" ON "fitment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fitment_model_id_engine_id_body_style_doors_drive_transmission_year_start_year_end_unique" ON "fitment" ("model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start", "year_end") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "fitment_model" add constraint "fitment_model_make_id_foreign" foreign key ("make_id") references "fitment_make" ("id") on update cascade;`);

    this.addSql(`alter table if exists "fitment" add constraint "fitment_model_id_foreign" foreign key ("model_id") references "fitment_model" ("id") on update cascade;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_engine_id_foreign" foreign key ("engine_id") references "fitment_engine" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_engine_id_foreign";`);

    this.addSql(`alter table if exists "fitment_model" drop constraint if exists "fitment_model_make_id_foreign";`);

    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_model_id_foreign";`);

    this.addSql(`drop table if exists "fitment_engine" cascade;`);

    this.addSql(`drop table if exists "fitment_make" cascade;`);

    this.addSql(`drop table if exists "fitment_model" cascade;`);

    this.addSql(`drop table if exists "fitment" cascade;`);
  }

}
