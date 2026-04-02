import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260325145018 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "entity_image" ("id" text not null, "url" text not null, "file_id" text not null, "type" text check ("type" in ('thumbnail', 'image')) not null, "entity_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "entity_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_entity_image_deleted_at" ON "entity_image" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "unique_thumbnail_per_entity" ON "entity_image" ("entity_id", "type") WHERE type = 'thumbnail' AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "entity_image" cascade;`);
  }

}
