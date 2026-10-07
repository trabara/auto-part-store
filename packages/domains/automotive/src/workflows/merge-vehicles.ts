// Merges a duplicate configuration into the one to keep, across modules: its
// fitments and garage entries are re-pointed (a fitment the kept one already
// has, same part and position, is deleted instead), then the vehicle module
// moves its catalog references and deletes it. Each step undoes itself if a
// later one fails.
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE, type FitmentModuleService } from "@repo/module-fitment";
import { GARAGE_MODULE, type GarageModuleService } from "@repo/module-garage";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";

export type MergeVehiclesInput = { from_id: string; into_id: string };

const repointFitmentsStep = createStep(
  "automotive-merge-vehicle-fitments",
  async ({ from_id, into_id }: MergeVehiclesInput, { container }) => {
    const fitments = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    const moving = await fitments.listFitments({ vehicle_id: from_id }, { select: ["id", "variant_id", "position_id"] });
    const kept = await fitments.listFitments({ vehicle_id: into_id }, { select: ["variant_id", "position_id"] });
    const slot = (f: { variant_id: string; position_id?: string | null }) => `${f.variant_id}|${f.position_id ?? ""}`;
    const taken = new Set(kept.map(slot));
    const duplicates = moving.filter((f) => taken.has(slot(f))).map((f) => f.id);
    const moved = moving.filter((f) => !taken.has(slot(f))).map((f) => f.id);
    if (duplicates.length) await fitments.softDeleteFitments(duplicates);
    if (moved.length) await fitments.updateFitments(moved.map((id) => ({ id, vehicle_id: into_id })) as any);
    return new StepResponse({ moved: moved.length, removed: duplicates.length }, { from_id, moved, duplicates });
  },
  async (undo, { container }) => {
    if (!undo) return;
    const fitments = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    if (undo.moved.length) await fitments.updateFitments(undo.moved.map((id) => ({ id, vehicle_id: undo.from_id })) as any);
    if (undo.duplicates.length) await fitments.restoreFitments(undo.duplicates);
  },
);

const repointGarageStep = createStep(
  "automotive-merge-vehicle-garage",
  async ({ from_id, into_id }: MergeVehiclesInput, { container }) => {
    const garage = container.resolve<GarageModuleService>(GARAGE_MODULE);
    const entries = await garage.listCustomerVehicles({ vehicle_id: from_id }, { select: ["id"] });
    if (entries.length) await garage.updateCustomerVehicles(entries.map((e) => ({ id: e.id, vehicle_id: into_id })) as any);
    return new StepResponse({ moved: entries.length }, { from_id, ids: entries.map((e) => e.id) });
  },
  async (undo, { container }) => {
    if (!undo?.ids.length) return;
    const garage = container.resolve<GarageModuleService>(GARAGE_MODULE);
    await garage.updateCustomerVehicles(undo.ids.map((id) => ({ id, vehicle_id: undo.from_id })) as any);
  },
);

const mergeVehicleRecordStep = createStep(
  "automotive-merge-vehicle-record",
  async ({ from_id, into_id }: MergeVehiclesInput, { container }) => {
    const undo = await container.resolve<VehicleModuleService>(VEHICLE_MODULE).mergeVehicle(from_id, into_id);
    return new StepResponse({ references: undo.references.length }, undo);
  },
  async (undo, { container }) => {
    if (undo) await container.resolve<VehicleModuleService>(VEHICLE_MODULE).unmergeVehicle(undo);
  },
);

export const mergeVehiclesWorkflow = createWorkflow("automotive-merge-vehicles", (input: MergeVehiclesInput) => {
  const fitments = repointFitmentsStep(input);
  const garage = repointGarageStep(input);
  const record = mergeVehicleRecordStep(input);
  return new WorkflowResponse({ fitments, garage, record });
});
