// Detail-page panels of the vehicle admin, given to `<Module sections>` by
// the admin page (UI code stays out of the module definition).
import type { DetailSectionDef } from "@repo/framework/core";
import { ProvenanceSection } from "./provenance-section";
import { ReviewSection } from "./review-section";

const provenance = (entity: string): DetailSectionDef[] => [
  { id: "provenance", render: (ctx: any) => <ProvenanceSection entity={entity} record={ctx.record} /> },
];

export const vehicleSections: Readonly<Record<string, readonly DetailSectionDef[]>> = {
  vehicle: provenance("Vehicle"),
  vehicle_make: provenance("VehicleMake"),
  vehicle_model: provenance("VehicleModel"),
  vehicle_generation: provenance("VehicleGeneration"),
  vehicle_engine: provenance("VehicleEngine"),
  catalog_task: [{ id: "review", render: (ctx: any) => <ReviewSection {...ctx} /> }],
};
