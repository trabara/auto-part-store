// The vehicle fields a fitment condition can test: the automotive domain's
// catalog for the fitment module's condition port. Isomorphic (the admin
// editor and the server register the same list).
import { z } from "@medusajs/framework/zod";
import { i18nKeys } from "@repo/framework/core";
import {
  attributesFromSchema,
  describeAttribute,
  humanizeValue,
  provideConditionAttributes,
  type AttributeMeta,
  type ConditionAttribute,
} from "@repo/module-fitment/conditions";
import { Vehicle, VehicleEngine, VehicleModel } from "@repo/module-vehicle/entities";

const META: Record<string, AttributeMeta> = {
  body_style: { label: "Body style" },
  doors: { label: "Doors" },
  drive: { label: "Drive" },
  transmission: { label: "Transmission" },
  trim: { label: "Trim" },
  year_start: { label: "First production year" },
  year_end: { label: "Last production year" },
  "engine.code": { label: "Engine code" },
  "engine.fuel": { label: "Fuel" },
  "engine.layout": { label: "Engine layout" },
  "engine.cylinders": { label: "Cylinders" },
  "engine.displacement_cc": { label: "Displacement", unit: "cm³" },
  "engine.power_kw": { label: "Power", unit: "kW" },
  "engine.power_hp": { label: "Power (hp)", unit: "hp" },
  "engine.name": { label: "Engine technology" },
  "generation.name": { label: "Generation" },
  "generation.code": { label: "Generation code" },
  "generation.model.name": { label: "Model" },
  "generation.model.category": { label: "Vehicle category" },
  "generation.model.make.name": { label: "Make" },
};

const VALUE_LABELS: Record<string, string> = {
  FWD: "Front-wheel drive",
  RWD: "Rear-wheel drive",
  AWD: "All-wheel drive",
  FOUR_WD: "4×4",
  CVT: "CVT",
  LPG: "LPG",
  CNG: "CNG",
  SUV: "SUV",
  LCV: "Light commercial",
  V: "V",
  W: "W",
};

/** "PLUG_IN_HYBRID" → "Plug-in hybrid" (overrides for acronyms and drives). */
export const vehicleValueLabel = (value: string) => VALUE_LABELS[value] ?? humanizeValue(value);

const model = (code: string, field: z.ZodTypeAny) =>
  describeAttribute(code, field, { group: "Model", ...META[code] }, vehicleValueLabel);

const vehicle = attributesFromSchema(Vehicle.schema, { group: "Vehicle", meta: META, valueLabel: vehicleValueLabel });

/** Entity fields whose enum value translations an attribute uses. */
const VALUE_SOURCES: Record<string, { entity: string; field: string }> = {
  ...Object.fromEntries(["body_style", "drive", "transmission"].map((f) => [f, { entity: "Vehicle", field: f }])),
  ...Object.fromEntries(["fuel", "layout"].map((f) => [`engine.${f}`, { entity: "VehicleEngine", field: f }])),
  "generation.model.category": { entity: "VehicleModel", field: "category" },
};

/** Admin translation keys: the domain's messages (labels, groups), the vehicle module's (values). */
const translated = (a: ConditionAttribute): ConditionAttribute => ({
  ...a,
  i18n: {
    label: i18nKeys.message("automotive", `attributes.${a.code}`),
    group: a.group ? i18nKeys.message("automotive", `attributeGroups.${a.group.toLowerCase()}`) : undefined,
    values: VALUE_SOURCES[a.code],
  },
});

/**
 * Every vehicle field a condition can test, generated from the vehicle schemas.
 * Drive first: the editor starts new conditions on the first attribute.
 */
export const VEHICLE_ATTRIBUTES: readonly ConditionAttribute[] = [
  ...vehicle.filter((a) => a.code === "drive"),
  ...vehicle.filter((a) => a.code !== "drive"),
  ...attributesFromSchema(VehicleEngine.schema, {
    prefix: "engine.",
    group: "Engine",
    meta: META,
    valueLabel: vehicleValueLabel,
  }),
  model("generation.name", z.string()),
  model("generation.code", z.string()),
  model("generation.model.name", z.string()),
  model("generation.model.category", VehicleModel.schema.shape.category),
  model("generation.model.make.name", z.string()),
].map(translated);

/** Vehicle paths conditions read: the fields to load on the tested vehicle. */
export const VEHICLE_ATTRIBUTE_PATHS: readonly string[] = VEHICLE_ATTRIBUTES.map((a) => a.code);

/** Registers the catalog with the fitment module (server and admin). */
export const registerVehicleConditions = () => provideConditionAttributes(VEHICLE_ATTRIBUTES);
