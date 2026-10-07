import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
export declare function PUT(req: AuthenticatedMedusaRequest<Record<string, unknown>>, res: MedusaResponse): Promise<void>;
export declare function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void>;
