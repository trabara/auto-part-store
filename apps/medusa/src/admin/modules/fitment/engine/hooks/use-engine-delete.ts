import { useDeleteMutation } from "~/admin/hooks/use-delete-mutation";
import { Engine } from "~/modules/fitment/schema";
import { deleteEngine } from "../data";
import { usePrompt } from "@medusajs/ui";

type UseEngineDeleteMutation = [
    (...engines: Engine[]) => Promise<void>,
    ReturnType<typeof useDeleteMutation>
]

export function useEngineDeleteMutation(): UseEngineDeleteMutation {
    const prompt = usePrompt();

    const deleteMutation = useDeleteMutation({
        invalidateKeys: ["engines"],
        successMessage: "Engine deleted successfully",
        errorMessage: "Failed to delete engine",
        deleteFn: deleteEngine,
    });

    const handler = async (...engines: Engine[]) => {
        const confirmed = await prompt({
            title: "Delete Engine(s)",
            description: `Are you sure you want to delete the selected engine(s)? This will also delete all associated fitments.`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (confirmed) {
            await deleteMutation.mutate(...engines.map(engine => engine.id));
        }
    }

    return [handler, deleteMutation]
}