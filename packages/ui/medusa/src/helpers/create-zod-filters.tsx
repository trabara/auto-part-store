import { z } from "@medusajs/framework/zod";
import { createDataTableFilterHelper, DataTableFilter } from "@medusajs/ui";
import { merge, startCase } from "lodash";
import { FilterFieldOverrides } from "../types";
import { Entity } from "../types/data";
import { getZodFieldInfo, getZodShape } from "../utils";

export function createZodDataTableFilterDef<
  S extends z.ZodObject,
  T extends Entity<z.infer<S>>,
>(schema: S, overrides: FilterFieldOverrides<T>): DataTableFilter[] {
  const filterHelper = createDataTableFilterHelper<T>();
  const shape = getZodShape(schema);
  const keys = Object.keys(overrides);
  return keys.reduce((fields: DataTableFilter[], key) => {
    const field = overrides[key as keyof T];
  
    if (!field?.isFiltrable) {
      return fields;
    }

    if (!shape[key]) {
      return fields;
    }

    const info = getZodFieldInfo(shape[key]);

    if (info.baseType === "array" || info.baseType === "enum") {
      const enumValues = (
        info.baseType === "enum" ? info.enumValues : []
      ) as string[];

      fields.push(
        filterHelper.accessor(key as any, {
          label: field?.label || startCase(String(key)),
          type: "select",
          options: enumValues.map((value) => ({
            label: startCase(value),
            value: value,
          })),
        }),
      );
    } else {
      fields.push(
        filterHelper.accessor(key as any, {
          label: field?.label || startCase(String(key)),
          type: "string",
          placeholder: `Filter by ${field?.label || String(key)}`,
        }),
      );
    }

    return fields;
  }, []);
}
