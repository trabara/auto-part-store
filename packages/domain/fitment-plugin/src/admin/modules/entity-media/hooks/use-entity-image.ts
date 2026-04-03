import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EntityImage } from "@trabara/core/dtos";
import { sdk } from "../../../lib/sdk";

type UseImageMutationsProps = {
  id: string;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: (deletedIds: string[]) => void;
  onUploadFailure?: (error: unknown) => void;
};

export const useEntityImageMutations = ({
  id,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onUploadFailure,
}: UseImageMutationsProps) => {
  const queryClient = useQueryClient();

  const uploadFilesMutation = useMutation({
    mutationFn: (files: File[]) => {
      return sdk.admin.upload.create({ files });
    },
    onError: (error) => {
      onUploadFailure?.(error);
    },
  });

  const createImagesMutation = useMutation({
    mutationFn: (images: Omit<EntityImage, "id">[]) => {
      return sdk.client.fetch(`/admin/medias/${id}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          images,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`medias-images`, id] });
      onCreateSuccess?.();
    },
  });

  const updateImagesMutation = useMutation({
    mutationFn: (updates: { id: string; type: "thumbnail" | "image" }[]) => {
      return sdk.client.fetch(`/admin/medias/${id}/images/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          updates,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`medias-images`, id] });
      // toast.success(t("gallery.file.update.success"))
      onUpdateSuccess?.();
    },
  });

  const deleteImagesMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return sdk.client.fetch(`/admin/medias/${id}/images/batch`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          ids,
        },
      });
    },
    onSuccess: (_data, deletedIds) => {
      queryClient.invalidateQueries({ queryKey: [`medias-images`, id] });
      // toast.success(t("gallery.file.delete.success"))
      onDeleteSuccess?.(deletedIds);
    },
  });

  return {
    uploadFilesMutation,
    createImagesMutation,
    updateImagesMutation,
    deleteImagesMutation,
  };
};
