import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { FITMENT_MODULE } from "../../../../modules/fitment";
import { UpdateEngineInput } from "../../../../modules/fitment/schema";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query");

  console.log("[GET /admin/engines/:id] Fetching engine with ID:", id);

  try {
    const { data } = await query.graph(
      {
        entity: "fitment_engine",
        fields: [
          "id",
          "fuel",
          "type",
          "size",
          "tech",
          "created_at",
          "updated_at",
          "fitments.*",
        ],
        filters: { id },
      },
      {
        throwIfKeyNotFound: true,
      },
    );

    console.log("[GET /admin/engines/:id] Found engine");

    res.json({ engine: data[0] });
  } catch (error: any) {
    console.error("[GET /admin/engines/:id] Error:", error.message);

    if (error.message?.includes("not found") || error.type === "not_found") {
      return res.status(404).json({ message: "Engine not found" });
    }

    return res
      .status(500)
      .json({ message: "Error fetching engine", error: error.message });
  }
}

export async function PATCH(
  req: MedusaRequest<UpdateEngineInput>,
  res: MedusaResponse,
) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);

  const [engine] = await fitmentModuleService.updateFitmentEngines([
    { ...req.validatedBody, id },
  ]);

  res.status(200).json({ engine });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);

  await fitmentModuleService.deleteEngineWithCascade(id);

  res.status(200).json({
    id,
    object: "engine",
    deleted: true,
  });
}
