import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006102627 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "brand" ("id" text not null, "name" text not null, "slug" text not null, "logo" text null, "kind" text check ("kind" in ('AFTERMARKET', 'OE', 'BOTH')) not null default 'AFTERMARKET', "option_value_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_brand_deleted_at" ON "brand" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "brand_option_value_id" ON "brand" ("option_value_id") WHERE deleted_at IS NULL;`);
    // Hand-written: brand names are unique case-insensitively.
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "brand_name_ci_unique" ON "brand" (lower("name")) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "part_number" ("id" text not null, "type" text check ("type" in ('MPN', 'OE', 'AFTERMARKET', 'PREVIOUS')) not null, "number" text not null, "number_normalized" text not null, "variant_id" text not null, "brand_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "part_number_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_part_number_variant_id" ON "part_number" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_part_number_brand_id" ON "part_number" ("brand_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_part_number_deleted_at" ON "part_number" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "part_number_unique" ON "part_number" ("variant_id", "type", "brand_id", "number_normalized") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "part_number_lookup" ON "part_number" ("number_normalized") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "part_number_brand_lookup" ON "part_number" ("brand_id", "number_normalized") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "part_number" drop constraint if exists "part_number_brand_id_foreign";`);
    this.addSql(`alter table if exists "part_number" add constraint "part_number_brand_id_foreign" foreign key ("brand_id") references "brand" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "brand_name_ci_unique";`);
    this.addSql(`alter table if exists "part_number" drop constraint if exists "part_number_brand_id_foreign";`);

    this.addSql(`drop table if exists "brand" cascade;`);

    this.addSql(`drop table if exists "part_number" cascade;`);
  }

}
