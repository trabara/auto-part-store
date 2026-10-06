import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006113833 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" add column if not exists "conditions_summary" text null;`);
    this.addSql(`alter table if exists "fitment_condition_group" add column if not exists "rank" integer not null default 0;`);
    this.addSql(`alter table if exists "fitment_condition" add column if not exists "rank" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment_condition_group" drop column if exists "rank";`);
    this.addSql(`alter table if exists "fitment_condition" drop column if exists "rank";`);
    this.addSql(`alter table if exists "fitment" drop column if exists "conditions_summary";`);
  }

}
