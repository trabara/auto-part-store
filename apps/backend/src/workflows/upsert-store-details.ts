import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  upsertStoreDetailsStep,
  type UpsertStoreDetailsStepInput,
} from "./steps/upsert-store-details";

export const upsertStoreDetailsWorkflow = createWorkflow(
  "upsert-store-details-workflow",
  function (input: UpsertStoreDetailsStepInput) {
    const storeDetails = upsertStoreDetailsStep(input);
    return new WorkflowResponse(storeDetails);
  },
);
