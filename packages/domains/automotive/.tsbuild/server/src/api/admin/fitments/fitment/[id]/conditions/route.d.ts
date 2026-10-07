import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { type ConditionGroupInput } from "@repo/module-fitment/contract";
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<void>;
export declare function PUT(req: MedusaRequest<{
    tree: ConditionGroupInput | null;
}>, res: MedusaResponse): Promise<void>;
