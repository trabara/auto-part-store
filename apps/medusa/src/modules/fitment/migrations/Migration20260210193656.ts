import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260210193656 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "engine" add column if not exists "tech" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "engine" drop column if exists "tech";`);
  }

}
