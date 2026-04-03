import { usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useDeleteMutation } from "../../../../hooks";
import { deleteModel } from "../data";
import { Model } from "@trabara/core/dtos";

type UseModelDeleteMutationReturn = [
  (...models: Model[]) => Promise<void>,
  ReturnType<typeof useDeleteMutation>,
];

export function useModelDeleteMutation(): UseModelDeleteMutationReturn {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const mutation = useDeleteMutation({
    invalidateKeys: ["models"],
    successMessage: t("model.toast.deleted"),
    errorMessage: t("model.toast.deleteError"),
    deleteFn: deleteModel,
  });

  const handler = async (...models: Model[]) => {
    const confirmed = await prompt({
      title: t("model.delete.title"),
      description: t("model.delete.description", {
        name: models.map((m) => m.name).join(", "),
      }),
      confirmText: t("model.delete.confirm"),
      cancelText: t("model.delete.cancel"),
    });

    if (confirmed) {
      mutation.mutate(...models.map((m) => m.id));
    }
  };

  return [handler, mutation];
}
