import type * as z from "@medusajs/framework/zod";
import type { BaseSchema } from "../schemas/base";

export type Base = z.infer<typeof BaseSchema>;
