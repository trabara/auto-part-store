import {
    usePrompt
} from "@medusajs/ui";
import { useDeleteMutation } from "~/admin/hooks";
import { deleteModel } from "../data";
import { Model } from "~/modules/fitment/schema";

type UseModelDeleteMutationReturn = [
    (...models: Model[]) => Promise<void>,
    ReturnType<typeof useDeleteMutation>
]
export function useModelDeleteMutation(): UseModelDeleteMutationReturn {
    const prompt = usePrompt();

    const mutation = useDeleteMutation({
        invalidateKeys: ["models"],
        successMessage: "Model deleted successfully",
        errorMessage: "Failed to delete model",
        deleteFn: deleteModel
    });

    const handler = async (...models: Model[]) => {
        const confirmed = await prompt({
            title: `Delete ${models.length} Model${models.length > 1 ? "s" : ""}`,
            description: `Are you sure you want to delete "${models.map(m => m.name).join(", ")}"? This will also delete all associated fitments.`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (confirmed) {
            mutation.mutate(...models.map(m => m.id));
        }
    };

    return [handler, mutation]
}