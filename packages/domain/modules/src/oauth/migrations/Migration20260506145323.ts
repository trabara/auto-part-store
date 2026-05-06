import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260506145323 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "oauth_provider_config" ("id" text not null, "provider" text not null, "client_id" text not null, "client_secret" text not null, "callback_url" text not null, "success_redirect_url" text not null, "enabled" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "oauth_provider_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_oauth_provider_config_deleted_at" ON "oauth_provider_config" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "oauth_provider_config" cascade;`);
  }

}
