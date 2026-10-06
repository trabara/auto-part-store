import { z } from "@medusajs/framework/zod";
import { createDataTableFilterHelper, DataTableFilter } from "@medusajs/ui";
import { getZodFieldInfo, getZodShape } from "@repo/framework/utils";
import { startCase } from "lodash";
import { FieldValues } from "react-hook-form";
import { FilterFieldOverrides } from "../types";
import { ensureZodObject } from "./create-zod-columns";

/** Filter UI text (the data table passes the user's language). */
export type FilterTexts = {
  rangeFrom: string;
  rangeTo: string;
  rangeBetween: string;
  today: string;
  yesterday: string;
  lastWeek: string;
  filterBy: (label: string) => string;
};

const ENGLISH: FilterTexts = {
  rangeFrom: "From",
  rangeTo: "To",
  rangeBetween: "Between",
  today: "Today",
  yesterday: "Yesterday",
  lastWeek: "Last week",
  filterBy: (label) => `Filter by ${label}`,
};

export function createZodDataTableFilterDef<T extends FieldValues>(
  schema: z.ZodType<T>,
  overrides: FilterFieldOverrides<T>,
  texts: FilterTexts = ENGLISH,
): DataTableFilter[] {
  const helper = createDataTableFilterHelper<T>();
  const shape = getZodShape(ensureZodObject(schema));

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
    if (info.baseType === "enum") {
      accessor = helper.accessor(key as any, {
        label,
        type: "multiselect",
        options:
          (field as { options?: { value: string; label: string }[] } | undefined)?.options ??
          (info.enumValues ?? []).map((value) => ({ label: startCase(value), value })),
      });
    } else if (info.baseType === "number") {
      accessor = helper.accessor(key as any, {
        label,
        type: "number",
        includeOperators: true,
      });
    } else if (info.baseType === "array" || info.baseType === "boolean") {
      accessor = null;
    } else if (info.baseType === "date") {
      accessor = helper.accessor(key as any, {
        label,
        type: "date",
        formatDateValue: (data) => data.toLocaleDateString(),
        rangeOptionStartLabel: texts.rangeFrom,
        rangeOptionEndLabel: texts.rangeTo,
        rangeOptionLabel: texts.rangeBetween,
        options: [
          {
            label: texts.today,
            value: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)).toString(),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)).toString(),
            },
          },
          {
            label: texts.yesterday,
            value: {
              $gte: new Date(
                new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000,
              ).toString(),
              $lte: new Date(new Date().setHours(0, 0, 0, 0)).toString(),
            },
          },
          {
            label: texts.lastWeek,
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
        placeholder: texts.filterBy(label),
      });
    }
    if (accessor) {
      accessors.push(accessor);
    }
    return accessors;
  }, []);
}
