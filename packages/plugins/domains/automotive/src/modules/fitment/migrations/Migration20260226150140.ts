import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260226150140 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists year_range_check;`);

    this.addSql(`alter table if exists "fitment" alter column "year_end" type integer using ("year_end"::integer);`);
    this.addSql(`alter table if exists "fitment" alter column "year_end" drop not null;`);
    this.addSql(`alter table if exists "fitment" add constraint year_range_check check(year_end IS NULL OR year_end >= year_start);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment" drop constraint if exists year_range_check;`);

    this.addSql(`alter table if exists "fitment" alter column "year_end" type integer using ("year_end"::integer);`);
    this.addSql(`alter table if exists "fitment" alter column "year_end" set not null;`);
    this.addSql(`alter table if exists "fitment" add constraint year_range_check check(year_end >= year_start);`);
  }

}
