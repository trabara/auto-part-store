import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260330132342 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "authz_member" drop constraint if exists "authz_member_user_id_role_id_unique";`);
    this.addSql(`alter table if exists "authz_role" drop constraint if exists "authz_role_name_unique";`);
    this.addSql(`alter table if exists "authz_permission" drop constraint if exists "authz_permission_kind_target_unique";`);
    this.addSql(`alter table if exists "authz_category" drop constraint if exists "authz_category_name_unique";`);
    this.addSql(`create table if not exists "authz_category" ("id" text not null, "name" text not null, "description" text null, "parent_category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "authz_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_category_parent_category_id" ON "authz_category" ("parent_category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_category_deleted_at" ON "authz_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_authz_category_name_unique" ON "authz_category" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "authz_permission" ("id" text not null, "kind" text check ("kind" in ('read', 'write', 'delete')) not null, "target" text not null, "type" text check ("type" in ('predefined', 'custom')) not null default 'custom', "category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "authz_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_permission_category_id" ON "authz_permission" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_permission_deleted_at" ON "authz_permission" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_authz_permission_kind_target_unique" ON "authz_permission" ("kind", "target") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "authz_role" ("id" text not null, "name" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "authz_role_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_role_deleted_at" ON "authz_role" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_authz_role_name_unique" ON "authz_role" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "authz_policy" ("id" text not null, "role_id" text not null, "permission_id" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "authz_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_policy_role_id" ON "authz_policy" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_policy_permission_id" ON "authz_policy" ("permission_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_policy_deleted_at" ON "authz_policy" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "authz_member" ("id" text not null, "user_id" text not null, "role_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "authz_member_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_member_role_id" ON "authz_member" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_authz_member_deleted_at" ON "authz_member" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_authz_member_user_id_role_id_unique" ON "authz_member" ("user_id", "role_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "authz_category" add constraint "authz_category_parent_category_id_foreign" foreign key ("parent_category_id") references "authz_category" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "authz_permission" add constraint "authz_permission_category_id_foreign" foreign key ("category_id") references "authz_category" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "authz_policy" add constraint "authz_policy_role_id_foreign" foreign key ("role_id") references "authz_role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "authz_policy" add constraint "authz_policy_permission_id_foreign" foreign key ("permission_id") references "authz_permission" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "authz_member" add constraint "authz_member_role_id_foreign" foreign key ("role_id") references "authz_role" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "authz_category" drop constraint if exists "authz_category_parent_category_id_foreign";`);

    this.addSql(`alter table if exists "authz_permission" drop constraint if exists "authz_permission_category_id_foreign";`);

    this.addSql(`alter table if exists "authz_policy" drop constraint if exists "authz_policy_permission_id_foreign";`);

    this.addSql(`alter table if exists "authz_policy" drop constraint if exists "authz_policy_role_id_foreign";`);

    this.addSql(`alter table if exists "authz_member" drop constraint if exists "authz_member_role_id_foreign";`);

    this.addSql(`drop table if exists "authz_category" cascade;`);

    this.addSql(`drop table if exists "authz_permission" cascade;`);

    this.addSql(`drop table if exists "authz_role" cascade;`);

    this.addSql(`drop table if exists "authz_policy" cascade;`);

    this.addSql(`drop table if exists "authz_member" cascade;`);
  }

}
