import { ExecArgs } from "@medusajs/framework/types";
import seedRbac from "./seed-rbac";
import seedStoreData from "./seed-store";

export default async function seedData(args: ExecArgs) {
    await seedStoreData(args);
    await seedRbac(args);
}