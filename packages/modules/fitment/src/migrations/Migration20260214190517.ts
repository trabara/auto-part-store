import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260214190517 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "fitment_engine_unique" ON "fitment_engine" ("fuel", "type", "size", "tech") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "fitment_engine_unique";`);
  }

}
