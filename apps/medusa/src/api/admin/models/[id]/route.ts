import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { FITMENT_MODULE } from "../../../../modules/fitment";
import { UpdateModelInput } from "../../../../modules/fitment/schema";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query");

  console.log("[GET /admin/models/:id] Fetching model with ID:", id);

  try {
    const { data } = await query.graph(
      {
        entity: "fitment_model",
        fields: [
          "id",
          "name",
          "created_at",
          "updated_at",
          "make.id",
          "make.name",
          "fitments.*",
        ],
        filters: { id },
      },
      {
        throwIfKeyNotFound: true,
      },
    );

    console.log("[GET /admin/models/:id] Found model");

    res.json({ model: data[0] });
  } catch (error: any) {
    console.error("[GET /admin/models/:id] Error:", error.message);

    if (error.message?.includes("not found") || error.type === "not_found") {
      return res.status(404).json({ message: "Model not found" });
    }

    return res
      .status(500)
      .json({ message: "Error fetching model", error: error.message });
  }
}

export async function PATCH(
  req: MedusaRequest<UpdateModelInput>,
  res: MedusaResponse,
) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);

  const [model] = await fitmentModuleService.updateFitmentModels([
    { ...req.validatedBody, id },
  ]);

  res.status(200).json({ model });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);

  await fitmentModuleService.deleteModelWithCascade(id);

  res.status(200).json({
    id,
    object: "model",
    deleted: true,
  });
}
