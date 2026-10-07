/** Ids to soft-delete, per entity. */
export type OrphanIds = {
    fitments: string[];
    partNumbers: string[];
    garage: string[];
};
export type FindOrphansInput = {
    /** Records of these deleted variants (and of the variants of these products). */
    variant_ids?: string[];
    product_ids?: string[];
    /** Garage entries of these deleted customers. */
    customer_ids?: string[];
    /** Every record whose variant, vehicle or customer is gone (one-off cleanup). */
    all?: boolean;
};
export declare const findOrphansStep: import("@medusajs/framework/workflows-sdk").StepFunction<FindOrphansInput, OrphanIds>;
/** Soft-deletes the orphans `input` selects; returns how many of each. */
export declare const removeOrphansWorkflow: import("@medusajs/framework/workflows-sdk").ReturnWorkflow<FindOrphansInput, {
    fitments: number;
    partNumbers: number;
    garage: number;
}, []>;
