import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212201431 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "engine" alter column "size" type text using ("size"::text);`);
    this.addSql(`alter table if exists "engine" alter column "size" set default '1.0';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "engine" alter column "size" type integer using ("size"::integer);`);
    this.addSql(`alter table if exists "engine" alter column "size" set default 1;`);
  }

}
