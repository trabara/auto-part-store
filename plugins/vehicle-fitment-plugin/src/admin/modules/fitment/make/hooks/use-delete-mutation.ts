import {
    usePrompt
} from "@medusajs/ui";
import { useDeleteMutation } from "../../../../hooks";
import { Make } from "../../../../../modules/fitment/schema";
import { deleteMake } from "../data";

type UseMakeDeleteMutationReturn = [
    (...makes: Make[]) => Promise<void>,
    ReturnType<typeof useDeleteMutation>
];

export function useMakeDeleteMutation(): UseMakeDeleteMutationReturn {
    const prompt = usePrompt();

    const mutation = useDeleteMutation({
        invalidateKeys: ["makes"],
        successMessage: "Make deleted successfully",
        errorMessage: "Failed to delete make",
        deleteFn: deleteMake,
    });

    const makeDeleteHandler = async (...makes: Make[]) => {
        const confirmed = await prompt({
            title: "Delete Makes",
            description: `Are you sure you want to delete the selected makes? This will also delete all associated models and fitments.`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (confirmed) {
            mutation.mutate(...makes.map((make) => make.id));
        }
    }


    return [makeDeleteHandler, mutation];
}   