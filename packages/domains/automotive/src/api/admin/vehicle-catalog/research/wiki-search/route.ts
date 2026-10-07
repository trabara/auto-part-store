// Wikipedia articles matching a query (free): the agent's first stop.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { webResearch } from "../../../../../queries/web-research";
import type { AdminResearchWikiSearchBody } from "../../../validators";

export async function POST(req: MedusaRequest<AdminResearchWikiSearchBody>, res: MedusaResponse) {
  const { query, lang } = req.validatedBody;
  res.json({ results: await webResearch(req.scope).wikiSearch(query, lang) });
}
