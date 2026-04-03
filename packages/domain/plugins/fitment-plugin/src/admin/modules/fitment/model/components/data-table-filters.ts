import { createDataTableFilterHelper } from "@medusajs/ui";
import { Model } from "@trabara/core/dtos";

const filterHelper = createDataTableFilterHelper<Model>();

export default [
  filterHelper.accessor("name", {
    type: "string",
    label: "Model Name",
  }),
  filterHelper.accessor("make.name", {
    type: "string",
    label: "Make",
  }),
];
