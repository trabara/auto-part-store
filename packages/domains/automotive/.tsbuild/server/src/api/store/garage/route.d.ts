import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
export declare function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void>;
export declare function POST(req: AuthenticatedMedusaRequest<Record<string, unknown>>, res: MedusaResponse): Promise<void>;
