import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { STORE_DETAILS_MODULE } from "../../../../modules/store";
import type { UpdateStoreDetailsInput } from "../../../../modules/store/schema";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "store",
    fields: ["id", "name", "store_details.*"],
  });

  const store = data[0];

  if (!store) {
    return res.status(404).json({ message: "Store not found" });
  }

  return res.json({
    store: {
      id: store.id,
      name: store.name,
      ...(store as any).store_details,
    },
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateStoreDetailsInput>,
  res: MedusaResponse,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const storeDetailsService = req.scope.resolve<any>(STORE_DETAILS_MODULE);

  try {
    const { data } = await query.graph({
      entity: "store",
      fields: ["id", "store_details.*"],
    });

    const store = data[0];

    if (!store) {
      throw new Error("Store not found");
    }

    const details = (store as any).store_details;
    const body = req.validatedBody;

    if (details) {
      const [updated] = await storeDetailsService.updateStoreDetails([{ id: details.id, ...body }]);

      return res.json({ store_details: updated });
    }

    const [created] = await storeDetailsService.createStoreDetails([body]);

    await link.create({
      [Modules.STORE]: {
        store_id: store.id
      },
      [STORE_DETAILS_MODULE]: {
        store_details_id: created.id
      },
    });

    return res.json({ store_details: created });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
