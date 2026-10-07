import type { BuildDate, FitmentMatch } from "@repo/module-fitment";
type Container = {
    resolve: <T = any>(key: string) => T;
};
export type { BuildDate, FitmentMatch };
export interface FitmentSearch {
    /** Fitments of the vehicle whose window and conditions match, grouped by variant. */
    fittingVariants(vehicleId: string, build?: BuildDate): Promise<Map<string, FitmentMatch[]>>;
}
/** Postgres: the vehicle's fields (vehicle module) evaluated by the fitment module. */
export declare class PostgresFitmentSearch implements FitmentSearch {
    private readonly container;
    constructor(container: Container);
    fittingVariants(vehicleId: string, build?: BuildDate): Promise<Map<string, FitmentMatch[]>>;
}
/** The search implementation for a request scope. */
export declare const fitmentSearch: (container: Container) => FitmentSearch;
