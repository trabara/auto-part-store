import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260330022010 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rbac_v2_member" drop constraint if exists "rbac_v2_member_user_id_role_id_unique";`);
    this.addSql(`alter table if exists "rbac_v2_policy" drop constraint if exists "rbac_v2_policy_name_unique";`);
    this.addSql(`alter table if exists "rbac_v2_policy" drop constraint if exists "rbac_v2_policy_permission_id_unique";`);
    this.addSql(`alter table if exists "rbac_v2_policy" drop constraint if exists "rbac_v2_policy_role_id_unique";`);
    this.addSql(`alter table if exists "rbac_v2_role" drop constraint if exists "rbac_v2_role_name_unique";`);
    this.addSql(`alter table if exists "rbac_v2_permission" drop constraint if exists "rbac_v2_permission_kind_target_unique";`);
    this.addSql(`alter table if exists "rbac_v2_category" drop constraint if exists "rbac_v2_category_name_unique";`);
    this.addSql(`create table if not exists "rbac_v2_category" ("id" text not null, "name" text not null, "description" text null, "parent_category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_v2_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_category_parent_category_id" ON "rbac_v2_category" ("parent_category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_category_deleted_at" ON "rbac_v2_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_category_name_unique" ON "rbac_v2_category" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_v2_permission" ("id" text not null, "kind" text check ("kind" in ('read', 'write', 'delete')) not null, "target" text not null, "type" text check ("type" in ('predefined', 'custom')) not null default 'custom', "category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_v2_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_permission_category_id" ON "rbac_v2_permission" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_permission_deleted_at" ON "rbac_v2_permission" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_permission_kind_target_unique" ON "rbac_v2_permission" ("kind", "target") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_v2_role" ("id" text not null, "name" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_v2_role_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_role_deleted_at" ON "rbac_v2_role" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_role_name_unique" ON "rbac_v2_role" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_v2_policy" ("id" text not null, "name" text not null, "role_id" text not null, "permission_id" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_v2_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_policy_role_id" ON "rbac_v2_policy" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_policy_permission_id" ON "rbac_v2_policy" ("permission_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_policy_deleted_at" ON "rbac_v2_policy" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_policy_role_id_unique" ON "rbac_v2_policy" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_policy_permission_id_unique" ON "rbac_v2_policy" ("permission_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_policy_name_unique" ON "rbac_v2_policy" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_v2_member" ("id" text not null, "user_id" text not null, "role_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_v2_member_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_member_role_id" ON "rbac_v2_member" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_v2_member_deleted_at" ON "rbac_v2_member" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_v2_member_user_id_role_id_unique" ON "rbac_v2_member" ("user_id", "role_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rbac_v2_category" add constraint "rbac_v2_category_parent_category_id_foreign" foreign key ("parent_category_id") references "rbac_v2_category" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "rbac_v2_permission" add constraint "rbac_v2_permission_category_id_foreign" foreign key ("category_id") references "rbac_v2_category" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "rbac_v2_policy" add constraint "rbac_v2_policy_role_id_foreign" foreign key ("role_id") references "rbac_v2_role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "rbac_v2_policy" add constraint "rbac_v2_policy_permission_id_foreign" foreign key ("permission_id") references "rbac_v2_permission" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "rbac_v2_member" add constraint "rbac_v2_member_role_id_foreign" foreign key ("role_id") references "rbac_v2_role" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "rbac_v2_category" drop constraint if exists "rbac_v2_category_parent_category_id_foreign";`);

    this.addSql(`alter table if exists "rbac_v2_permission" drop constraint if exists "rbac_v2_permission_category_id_foreign";`);

    this.addSql(`alter table if exists "rbac_v2_policy" drop constraint if exists "rbac_v2_policy_permission_id_foreign";`);

    this.addSql(`alter table if exists "rbac_v2_policy" drop constraint if exists "rbac_v2_policy_role_id_foreign";`);

    this.addSql(`alter table if exists "rbac_v2_member" drop constraint if exists "rbac_v2_member_role_id_foreign";`);

    this.addSql(`drop table if exists "rbac_v2_category" cascade;`);

    this.addSql(`drop table if exists "rbac_v2_permission" cascade;`);

    this.addSql(`drop table if exists "rbac_v2_role" cascade;`);

    this.addSql(`drop table if exists "rbac_v2_policy" cascade;`);

    this.addSql(`drop table if exists "rbac_v2_member" cascade;`);
  }

}
