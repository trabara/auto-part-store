import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260326141129 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rbac_permission" drop constraint if exists "rbac_permission_kind_target_unique";`);
    this.addSql(`alter table if exists "rbac_category" drop constraint if exists "rbac_category_name_unique";`);
    this.addSql(`create table if not exists "rbac_category" ("id" text not null, "name" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_category_deleted_at" ON "rbac_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_category_name_unique" ON "rbac_category" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_member" ("id" text not null, "user_id" text not null, "role_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_member_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_member_deleted_at" ON "rbac_member" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_permission" ("id" text not null, "kind" text check ("kind" in ('read', 'write', 'delete')) not null, "target" text not null, "type" text check ("type" in ('predefined', 'custom')) not null default 'custom', "category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_permission_deleted_at" ON "rbac_permission" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_permission_kind_target_unique" ON "rbac_permission" ("kind", "target") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_policy" ("id" text not null, "name" text check ("name" in ('ALLOW', 'DENY')) not null, "permission_id" text not null, "role_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_policy_deleted_at" ON "rbac_policy" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_role" ("id" text not null, "name" text not null, "description" text null, "is_default" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_role_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_deleted_at" ON "rbac_role" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "rbac_category" cascade;`);

    this.addSql(`drop table if exists "rbac_member" cascade;`);

    this.addSql(`drop table if exists "rbac_permission" cascade;`);

    this.addSql(`drop table if exists "rbac_policy" cascade;`);

    this.addSql(`drop table if exists "rbac_role" cascade;`);
  }

}
