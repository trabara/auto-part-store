import { createDataTableFilterHelper } from "@medusajs/ui";
import { TFunction } from "i18next";
import {
  BODY_STYLE_OPTIONS,
  DRIVE_OPTIONS,
  ENGINE_SIZE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "@repo/domain-modules/fitment/constant";
import { Engine, Fitment, Model } from "@trabara/core/dtos";

const filterHelper = createDataTableFilterHelper<
  Fitment & { model: Model; engine: Engine }
>();

export const createFitmentFilters = (t: TFunction) => {
  return [
    filterHelper.accessor("body_style", {
      type: "select",
      label: t("fitment.column.bodyStyle"),
      options: BODY_STYLE_OPTIONS,
    }),
    filterHelper.accessor("model.make.name", {
      type: "string",
      label: t("fitment.column.make"),
    }),
    filterHelper.accessor("model.name", {
      type: "string",
      label: t("fitment.column.model"),
    }),
    filterHelper.accessor("engine.size", {
      type: "select",
      label: t("fitment.column.engineSize"),
      options: ENGINE_SIZE_OPTIONS,
    }),
    filterHelper.accessor("engine.fuel", {
      type: "select",
      label: t("fitment.column.fuelType"),
      options: ENGINE_TYPE_OPTIONS,
    }),
    filterHelper.accessor("drive", {
      type: "select",
      label: t("fitment.column.driveType"),
      options: DRIVE_OPTIONS,
    }),
    filterHelper.accessor("transmission", {
      type: "select",
      label: t("fitment.column.transmission"),
      options: TRANSMISSION_OPTIONS,
    }),
    filterHelper.accessor("year_start", {
      type: "number",
      label: t("fitment.column.yearStart"),
    }),
    filterHelper.accessor("year_end", {
      type: "number",
      label: t("fitment.column.yearEnd"),
    }),
  ];
};
