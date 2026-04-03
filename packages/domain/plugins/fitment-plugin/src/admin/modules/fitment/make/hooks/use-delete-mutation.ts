import { usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useDeleteMutation } from "../../../../hooks";
import { Make } from "@trabara/core/dtos";
import { deleteMake } from "../data";

type UseMakeDeleteMutationReturn = [
  (...makes: Make[]) => Promise<void>,
  ReturnType<typeof useDeleteMutation>,
];

export function useMakeDeleteMutation(): UseMakeDeleteMutationReturn {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const mutation = useDeleteMutation({
    invalidateKeys: ["makes"],
    successMessage: t("make.toast.deleted"),
    errorMessage: t("make.toast.deleteError"),
    deleteFn: deleteMake,
  });

  const makeDeleteHandler = async (...makes: Make[]) => {
    const confirmed = await prompt({
      title: t("make.delete.title"),
      description: t("make.delete.description", {
        name: makes.map((m) => m.name).join(", "),
      }),
      confirmText: t("make.delete.confirm"),
      cancelText: t("make.delete.cancel"),
    });

    if (confirmed) {
      mutation.mutate(...makes.map((make) => make.id));
    }
  };

  return [makeDeleteHandler, mutation];
}
