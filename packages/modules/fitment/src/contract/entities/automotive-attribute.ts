import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { conditionAttribute } from "../ports";
import { DataType } from "./enums";

export const AutomotiveAttribute = defineEntity("AutomotiveAttribute", {
  schema: BaseSchema.extend({
    // A path in the injected catalog (drive, engine.fuel, …): what the
    // condition tests. Read at validation time, after the domain registered it.
    code: z
      .string()
      .trim()
      .toLowerCase()
      .refine((code) => !!conditionAttribute(code), { message: "must be a field conditions can test" })
      .describe("The vehicle field this attribute tests"),
    name: z.string().trim().min(1).describe("Display name, e.g. Drive, Power"),
    data_type: z.enum(DataType).describe("Value type, derived from the vehicle field"),
    default_unit: z.string().nullable().describe("Unit shown with values, e.g. kW"),
    category: z.string().nullable().describe("Grouping in pickers, e.g. Engine"),
  }),
  // The type comes from the vehicle field: staff never choose it.
  derived: {
    data_type: { from: ["code"], compute: (a) => conditionAttribute(a.code)?.data_type ?? DataType.STRING },
  },
  indexes: [{ name: "automotive_attribute_code_unique", on: ["code"], unique: true }],
});

export type AutomotiveAttribute = InferEntity<typeof AutomotiveAttribute>;
