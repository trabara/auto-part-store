import { sdk } from "../../../lib/sdk"
import { PaginatedQueryParams } from "../../../hooks"
import { AdminProductListWithFitmentsResponse } from "./types"

export function listProductsWithFitments(signal: AbortSignal, params: PaginatedQueryParams): Promise<AdminProductListWithFitmentsResponse> {
    return sdk.client.fetch(
        `/admin/products`,
        {
            signal,
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