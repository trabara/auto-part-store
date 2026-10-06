import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006085521 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index if exists "vehicle_make_name_unique";`);

    this.addSql(`drop index if exists "vehicle_model_make_name_unique";`);

    // Case-insensitive uniqueness (hand-written: DML indexes can't hold expressions).
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_make_name_ci_unique" ON "vehicle_make" (lower("name")) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_model_make_name_ci_unique" ON "vehicle_model" ("make_id", lower("name")) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle" add constraint year_bounds_check check(year_start BETWEEN 1886 AND 2100);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "vehicle_make_name_ci_unique";`);
    this.addSql(`drop index if exists "vehicle_model_make_name_ci_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_make_name_unique" ON "vehicle_make" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_model_make_name_unique" ON "vehicle_model" ("make_id", "name") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vehicle" drop constraint if exists year_bounds_check;`);
  }

}
