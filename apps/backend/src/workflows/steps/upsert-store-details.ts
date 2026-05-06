import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STORE_DETAILS_MODULE } from "../../modules/store-details";
import StoreDetailsModuleService from "../../modules/store-details/services/store-details-module.service";

export type UpsertStoreDetailsStepInput = {
  name?: string;
  map_url?: string | null;
  address?: string | null;
  contact_emails?: string[] | null;
  contact_phone_numbers?: string[] | null;
  social_links?: Record<string, string> | null;
};

export const upsertStoreDetailsStep = createStep(
  "upsert-store-details-step",
  async (input: UpsertStoreDetailsStepInput, { container }) => {
    const service =
      container.resolve<StoreDetailsModuleService>(STORE_DETAILS_MODULE);

    const existing = await service.listStoreDetails();

    let storeDetails;

    if (existing.length > 0) {
      const record = existing[0];
      const [updated] = await service.updateStoreDetails([
        {
          selector: { id: record.id },
          data: input,
        } as any,
      ]);
      storeDetails = updated;
    } else {
      storeDetails = await service.createStoreDetails({
        name: input.name ?? "My Store",
        map_url: input.map_url ?? null,
        address: input.address ?? null,
        contact_emails: input.contact_emails ?? null,
        contact_phone_numbers: input.contact_phone_numbers ?? null,
        social_links: input.social_links ?? null,
      } as any);
    }

    return new StepResponse(storeDetails);
  },
  async (_storeDetails, { container }) => {
    // Singleton upsert — no rollback needed
  },
);
