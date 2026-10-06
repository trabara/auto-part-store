// Replaces a fitment's condition tree; the rules live in FitmentModuleService.
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE, type FitmentModuleService } from "../modules/fitment";
import type { ConditionGroupInput } from "../modules/fitment/conditions";
import type { ReplaceConditionsUndo } from "../modules/fitment/service";

export type ReplaceFitmentConditionsInput = { fitment_id: string; tree: ConditionGroupInput | null };

export const replaceFitmentConditionsStep = createStep(
  "replace-fitment-conditions",
  async ({ fitment_id, tree }: ReplaceFitmentConditionsInput, { container }) => {
    const { summary, undo } = await container
      .resolve<FitmentModuleService>(FITMENT_MODULE)
      .replaceConditions(fitment_id, tree);
    return new StepResponse({ summary }, undo);
  },
  async (undo: ReplaceConditionsUndo | undefined, { container }) => {
    if (undo) await container.resolve<FitmentModuleService>(FITMENT_MODULE).undoReplaceConditions(undo);
  },
);

export const replaceFitmentConditionsWorkflow = createWorkflow(
  "replace-fitment-conditions",
  (input: ReplaceFitmentConditionsInput) => new WorkflowResponse(replaceFitmentConditionsStep(input)),
);
