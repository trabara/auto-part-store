import { usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useDeleteMutation } from "../../../../hooks/use-delete-mutation";
import { Engine } from "@trabara/core/dtos";
import { deleteEngine } from "../data";

type UseEngineDeleteMutation = [
  (...engines: Engine[]) => Promise<void>,
  ReturnType<typeof useDeleteMutation>,
];

export function useEngineDeleteMutation(): UseEngineDeleteMutation {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["engines"],
    successMessage: t("engine.toast.deleted"),
    errorMessage: t("engine.toast.deleteError"),
    deleteFn: deleteEngine,
  });

  const handler = async (...engines: Engine[]) => {
    const confirmed = await prompt({
      title: t("engine.delete.title"),
      description: t("engine.delete.description"),
      confirmText: t("engine.delete.confirm"),
      cancelText: t("engine.delete.cancel"),
    });

    if (confirmed) {
      await deleteMutation.mutate(...engines.map((engine) => engine.id));
    }
  };

  return [handler, deleteMutation];
}
