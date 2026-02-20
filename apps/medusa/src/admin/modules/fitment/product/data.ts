import { sdk } from "~/admin/lib/sdk"
import { PaginatedQueryParams } from "~/admin/hooks"
import { AdminProductListWithFitmentsResponse } from "./types"

export function listProductsWithFitments(params: PaginatedQueryParams): Promise<AdminProductListWithFitmentsResponse> {
    return sdk.client.fetch(
        `/admin/products`,
        {
            query: {
                ...params,
                fields: "*variants.*,*collection.*,*fitments.*"
            },
        },
    ).then((res: any) => {
        return {
            products: res.products,
            metadata: {
                count: res.count,
                offset: res.offset,
                limit: res.limit,
            }
        }
    })
}