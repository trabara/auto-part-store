import { AdminProductListResponse } from "@medusajs/framework/types";
import { PageQueryParams } from "@repo/admin/types/query";
import { sdk } from "../../lib/sdk";

export function listProductsWithFitments(signal: AbortSignal, params: PageQueryParams) {
    return sdk.client.fetch<AdminProductListResponse>(
        `/admin/products`,
        {
            signal,
            query: {
                ...params,
                fields: "*variants.*,*collection.*,*fitments.*"
            },
        },
    ).then((resp) => ({
        data: resp.products,
        metadata: {
            count: resp.count,
            offset: resp.offset,
            limit: resp.limit,
        }
    }));
}