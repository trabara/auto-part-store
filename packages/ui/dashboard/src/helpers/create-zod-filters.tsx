import { z } from "@medusajs/framework/zod";
import { createDataTableFilterHelper, DataTableFilter } from "@medusajs/ui";
import { startCase } from "lodash";
import { FilterFieldOverrides } from "../types";
import { Entity } from "../types/data";
import { getZodFieldInfo, getZodShape } from "../utils";

export function createZodDataTableFilterDef<
  S extends z.ZodObject,
  T extends Entity<z.infer<S>>,
>(schema: S, overrides: FilterFieldOverrides<T>): DataTableFilter[] {
  const helper = createDataTableFilterHelper<T>();
  const shape = getZodShape(schema);

  return Object.keys(shape).reduce((accessors: DataTableFilter[], key) => {
    const field = overrides?.[key];

    if (field?.isFiltrable === false) {
      return accessors;
    }

    if (!shape[key]) {
      return accessors;
    }

    const info = getZodFieldInfo(shape[key]);
    const label = field?.label || startCase(String(key));

    let accessor = null;
    if (info.baseType === "array" || info.baseType === "enum") {
      const enumValues = (
        info.baseType === "enum" ? info.enumValues : []
      ) as string[];

      accessor = helper.accessor(key as any, {
        label,
        type: "select",
        options: enumValues.map((value) => ({
          label: startCase(value),
          value: value,
        })),
      });
    } else if (info.baseType === "date") {
      accessor = helper.accessor(key as any, {
        label,
        type: "date",
        formatDateValue: (data) => data.toLocaleDateString(),
        rangeOptionStartLabel: "From",
        rangeOptionEndLabel: "To",
        rangeOptionLabel: "Between",
        options: [
          {
            label: "Today",
            value: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)).toString(),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)).toString(),
            },
          },
          {
            label: "Yesterday",
            value: {
              $gte: new Date(
                new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000,
              ).toString(),
              $lte: new Date(new Date().setHours(0, 0, 0, 0)).toString(),
            },
          },
          {
            label: "Last Week",
            value: {
              $gte: new Date(
                new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000,
              ).toString(),
              $lte: new Date(new Date().setHours(0, 0, 0, 0)).toString(),
            },
          },
        ],
      });
    } else if (info.baseType === "object") {
      accessor = null;
    } else {
      accessor = helper.accessor(key as any, {
        label,
        type: "string",
        placeholder: `Filter by ${label}`,
      });
    }
    if (accessor) {
      accessors.push(accessor);
    }
    return accessors;
  }, []);
}
