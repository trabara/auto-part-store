import { createDataTableFilterHelper } from "@medusajs/ui"
import { BODY_STYLE_OPTIONS, DRIVE_OPTIONS, ENGINE_SIZE_OPTIONS, ENGINE_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from "../../../../../modules/fitment/constant"
import { Fitment } from "~/modules/fitment/schema"

const filterHelper = createDataTableFilterHelper<Fitment>()

export default [
    filterHelper.accessor("body_style", {
        type: "select",
        label: "Body Style",
        options: BODY_STYLE_OPTIONS
    }),
    filterHelper.accessor("model.make.name", {
        type: "string",
        label: "Make",
    }),
    filterHelper.accessor("model.name", {
        type: "string",
        label: "Model",
    }),
    filterHelper.accessor("engine.size", {
        type: "select",
        label: "Engine Size",
        options: ENGINE_SIZE_OPTIONS
    }),
    filterHelper.accessor("engine.fuel", {
        type: "select",
        label: "Fuel Type",
        options: ENGINE_TYPE_OPTIONS
    }),
    filterHelper.accessor("drive", {
        type: "select",
        label: "Drive Type",
        options:DRIVE_OPTIONS
    }),
    filterHelper.accessor("transmission", {
        type: "select",
        label: "Transmission",
        options: TRANSMISSION_OPTIONS
    }),
    filterHelper.accessor("year_start", {
        type: "number",
        label: "Year Start",
    }),
    filterHelper.accessor("year_end", {
        type: "number",
        label: "Year End",
    }),
]
