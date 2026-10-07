import type { MedusaStoreRequest } from "@medusajs/framework/http";
export type ProductFilters = {
    region_id?: string;
    category_id?: string | string[];
    brand_id?: string;
};
export type Page = {
    limit: number;
    offset: number;
};
/**
 * Products (with only the given variants) for the storefront, paged by
 * product. `extra(variantId)` adds per-variant data (fitments, match info).
 */
export declare function storeProducts<X extends object>(req: MedusaStoreRequest<unknown>, variantIds: string[], filters: ProductFilters, page: Page, extra: (variantId: string) => X): Promise<{
    limit: number;
    offset: number;
    products: any[];
    count: number;
}>;
