import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006110754 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "customer_vehicle" add column if not exists "build_year" integer null, add column if not exists "build_month" integer null;`);
    this.addSql(`alter table if exists "customer_vehicle" add constraint customer_vehicle_build_month_check check(build_month IS NULL OR build_year IS NOT NULL);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "customer_vehicle" drop constraint if exists customer_vehicle_build_month_check;`);
    this.addSql(`alter table if exists "customer_vehicle" drop column if exists "build_year", drop column if exists "build_month";`);
  }

}
