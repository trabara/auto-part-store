import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005170552 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "vehicle" add constraint "year_range_check" check (year_end IS NULL OR year_end >= year_start);`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "vehicle" drop constraint if exists "year_range_check";`
    );
  }
}
