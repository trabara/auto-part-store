import { createDataTableFilterHelper } from "@medusajs/ui";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_TYPE_OPTIONS,
  ENGINE_SIZE_OPTIONS,
} from "../../../../modules/fitment/constant";
import { Engine } from "~/modules/fitment/schema";

const filterHelper = createDataTableFilterHelper<Engine>();

export default [
  filterHelper.accessor("fuel", {
    type: "select",
    label: "Fuel Type",
    options: ENGINE_FUEL_OPTIONS,
  }),
  filterHelper.accessor("type", {
    type: "select",
    label: "Engine Type",
    options: ENGINE_TYPE_OPTIONS,
  }),
  filterHelper.accessor("size", {
    type: "select",
    label: "Engine Size",
    options: ENGINE_SIZE_OPTIONS,
  }),
  filterHelper.accessor("tech", {
    type: "string",
    label: "Technology",
  }),
];
