import type { ConditionGroupInput } from "@repo/module-fitment/contract";
export type ReplaceFitmentConditionsInput = {
    fitment_id: string;
    tree: ConditionGroupInput | null;
};
export declare const replaceFitmentConditionsStep: import("@medusajs/framework/workflows-sdk").StepFunction<ReplaceFitmentConditionsInput, {
    summary: Record<string, string> | null;
}>;
export declare const replaceFitmentConditionsWorkflow: import("@medusajs/framework/workflows-sdk").ReturnWorkflow<ReplaceFitmentConditionsInput, {
    summary: Record<string, string> | null;
}, []>;
