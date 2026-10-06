import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006084342 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "automotive_attribute" rename column "dataType" to "data_type";`);
    this.addSql(`alter table if exists "automotive_attribute" rename column "defaultUnit" to "default_unit";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "automotive_attribute_code_unique" ON "automotive_attribute" ("code") WHERE deleted_at IS NULL;`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "fitment_position_code_unique" ON "fitment_position" ("code") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "fitment_condition" rename column "valueTo" to "value_to";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "automotive_attribute_code_unique";`);

    this.addSql(`alter table if exists "automotive_attribute" rename column "data_type" to "dataType";`);
    this.addSql(`alter table if exists "automotive_attribute" rename column "default_unit" to "defaultUnit";`);

    this.addSql(`drop index if exists "fitment_position_code_unique";`);

    this.addSql(`alter table if exists "fitment_condition" rename column "value_to" to "valueTo";`);
  }

}
