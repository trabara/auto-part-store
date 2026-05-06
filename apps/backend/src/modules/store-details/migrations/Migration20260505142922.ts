import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260505142922 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "store_details" ("id" text not null, "name" text not null, "map_url" text null, "address" text null, "contact_emails" jsonb null, "contact_phone_numbers" jsonb null, "social_links" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_details_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_details_deleted_at" ON "store_details" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_details" cascade;`);
  }

}
