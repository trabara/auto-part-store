import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005224758 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_make" add column if not exists "logo" text null;`);

    this.addSql(`alter table if exists "vehicle_model" add column if not exists "image" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_make" drop column if exists "logo";`);

    this.addSql(`alter table if exists "vehicle_model" drop column if exists "image";`);
  }

}
