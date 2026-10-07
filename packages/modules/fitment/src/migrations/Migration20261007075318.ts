import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// conditions_summary: English text → one summary per locale ({ "en": "…" }).
// Other locales are filled when conditions are next saved, or by the
// automotive domain's `refresh-condition-summaries` script.
export class Migration20261007075318 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fitment" alter column "conditions_summary" type jsonb using (case when "conditions_summary" is null then null else jsonb_build_object('en', "conditions_summary") end);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "fitment" alter column "conditions_summary" type text using ("conditions_summary"->>'en');`);
  }

}
