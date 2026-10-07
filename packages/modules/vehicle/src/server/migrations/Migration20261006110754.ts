import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// Added customer_vehicle's build date; the table moved to the garage module,
// whose migrations create it. Kept (empty) as it is recorded on existing databases.
export class Migration20261006110754 extends Migration {

  override async up(): Promise<void> {}

  override async down(): Promise<void> {}

}
