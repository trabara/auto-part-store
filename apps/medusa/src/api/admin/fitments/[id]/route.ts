import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { FITMENT_MODULE } from "../../../../modules/fitment";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query");

  console.log("[GET /admin/fitments/:id] Fetching fitment with ID:", id);

  try {
    // Use query.graph() to retrieve the fitment with relations
    const { data } = await query.graph(
      {
        entity: "fitment",
        fields: [
          "id",
          "body_style",
          "drive",
          "transmission",
          "doors",
          "year_start",
          "year_end",
          "model.id",
          "model.name",
          "model.make.id",
          "model.make.name",
          "engine.id",
          "engine.fuel",
          "engine.type",
          "engine.size",
          "engine.tech",
        ],
        filters: { id },
      },
      {
        throwIfKeyNotFound: true,
      },
    );

    console.log("[GET /admin/fitments/:id] Found fitment");

    res.json({ fitment: data[0] });
  } catch (error: any) {
    console.error("[GET /admin/fitments/:id] Error:", error.message);

    // throwIfKeyNotFound throws a specific error
    if (error.message?.includes("not found") || error.type === "not_found") {
      return res.status(404).json({ message: "Fitment not found" });
    }

    return res
      .status(500)
      .json({ message: "Error fetching fitment", error: error.message });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  await fitmentModuleService.deleteFitments(id);

  res.status(200).json({
    id,
    object: "fitment",
    deleted: true,
  });
}
