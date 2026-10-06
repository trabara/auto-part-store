import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006090738 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_position_id_foreign";`);

    // Hand-edited: ids are added nullable, backfilled from the former link
    // tables, then required. Fitments without both ids (no part or no vehicle)
    // can't become applications and are removed with their conditions.
    this.addSql(`alter table if exists "fitment" add column if not exists "quantity" integer not null default 1, add column if not exists "from_year" integer null, add column if not exists "from_month" integer null, add column if not exists "to_year" integer null, add column if not exists "to_month" integer null, add column if not exists "variant_id" text null, add column if not exists "vehicle_id" text null;`);
    this.addSql(`
      DO $$ BEGIN
        IF to_regclass('fitment_fitment_vehicle_vehicle') IS NOT NULL THEN
          UPDATE "fitment" f SET "vehicle_id" = l."vehicle_id"
          FROM "fitment_fitment_vehicle_vehicle" l
          WHERE l."fitment_id" = f."id" AND l."deleted_at" IS NULL AND f."vehicle_id" IS NULL;
        END IF;
        IF to_regclass('fitment_fitment_product_product_variant') IS NOT NULL THEN
          UPDATE "fitment" f SET "variant_id" = l."product_variant_id"
          FROM (
            SELECT DISTINCT ON ("fitment_id") "fitment_id", "product_variant_id"
            FROM "fitment_fitment_product_product_variant"
            WHERE "deleted_at" IS NULL
            ORDER BY "fitment_id", "created_at"
          ) l
          WHERE l."fitment_id" = f."id" AND f."variant_id" IS NULL;
        END IF;
      END $$;
    `);
    this.addSql(`delete from "fitment_condition" where "group_id" in (select g."id" from "fitment_condition_group" g join "fitment" f on f."id" = g."fitment_id" where f."variant_id" is null or f."vehicle_id" is null);`);
    this.addSql(`delete from "fitment_condition_group" where "fitment_id" in (select "id" from "fitment" where "variant_id" is null or "vehicle_id" is null);`);
    this.addSql(`delete from "fitment" where "variant_id" is null or "vehicle_id" is null;`);
    this.addSql(`alter table if exists "fitment" alter column "variant_id" set not null, alter column "vehicle_id" set not null;`);
    // One application per (variant, vehicle, position), a missing position included.
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "fitment_application_unique" ON "fitment" ("variant_id", "vehicle_id", "position_id") NULLS NOT DISTINCT WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "fitment" alter column "position_id" type text using ("position_id"::text);`);
    this.addSql(`alter table if exists "fitment" alter column "position_id" drop not null;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_position_id_foreign" foreign key ("position_id") references "fitment_position" ("id") on update cascade on delete set null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_variant_id" ON "fitment" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_vehicle_id" ON "fitment" ("vehicle_id") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "fitment" add constraint fitment_from_month_check check(from_month IS NULL OR from_year IS NOT NULL);`);
    this.addSql(`alter table if exists "fitment" add constraint fitment_to_month_check check(to_month IS NULL OR to_year IS NOT NULL);`);
    this.addSql(`alter table if exists "fitment" add constraint fitment_range_check check(from_year IS NULL OR to_year IS NULL OR to_year * 100 + COALESCE(to_month, 12) >= from_year * 100 + COALESCE(from_month, 1));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "fitment_application_unique";`);
    this.addSql(`alter table if exists "fitment" drop constraint if exists "fitment_position_id_foreign";`);

    this.addSql(`drop index if exists "IDX_fitment_variant_id";`);
    this.addSql(`drop index if exists "IDX_fitment_vehicle_id";`);
    this.addSql(`alter table if exists "fitment" drop constraint if exists fitment_from_month_check;`);
    this.addSql(`alter table if exists "fitment" drop constraint if exists fitment_to_month_check;`);
    this.addSql(`alter table if exists "fitment" drop constraint if exists fitment_range_check;`);
    this.addSql(`alter table if exists "fitment" drop column if exists "quantity", drop column if exists "from_year", drop column if exists "from_month", drop column if exists "to_year", drop column if exists "to_month", drop column if exists "variant_id", drop column if exists "vehicle_id";`);

    this.addSql(`alter table if exists "fitment" alter column "position_id" type text using ("position_id"::text);`);
    this.addSql(`alter table if exists "fitment" alter column "position_id" set not null;`);
    this.addSql(`alter table if exists "fitment" add constraint "fitment_position_id_foreign" foreign key ("position_id") references "fitment_position" ("id") on update cascade;`);
  }

}
