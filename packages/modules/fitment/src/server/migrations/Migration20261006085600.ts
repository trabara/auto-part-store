import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * - Renames the check constraint left behind by the `dataType` → `data_type`
 *   column rename, so later enum changes find it under the expected name.
 * - Normalises stored codes the way the schema now does on write.
 */
export class Migration20261006085600 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automotive_attribute_dataType_check') THEN
          ALTER TABLE "automotive_attribute"
            RENAME CONSTRAINT "automotive_attribute_dataType_check" TO "automotive_attribute_data_type_check";
        END IF;
      END $$;
    `);
    this.addSql(`update "automotive_attribute" set "code" = lower(trim("code")) where "code" <> lower(trim("code"));`);
    this.addSql(`update "fitment_position" set "code" = upper(trim("code")) where "code" <> upper(trim("code"));`);
  }

  override async down(): Promise<void> {
    // Normalised codes and the constraint name are kept.
  }
}
