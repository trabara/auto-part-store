import Medusa from "@medusajs/js-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Media, UploadedFile } from "../types";
import { useSdk } from "../../common/context";

type UseMediaMutationsProps = {
  id: string;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: (deletedIds: string[]) => void;
  onUploadFailure?: (error: unknown) => void;
};

export const useMediaMutations = ({
  id,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onUploadFailure,
}: UseMediaMutationsProps) => {
  const queryClient = useQueryClient();
  const sdk = useSdk();

  const uploadFilesMutation = useMutation<
    { files: UploadedFile[] },
    Error,
    File[]
  >({
    mutationFn: (files: File[]) => {
      return sdk.admin.upload.create({ files }) as Promise<{
        files: UploadedFile[];
      }>;
    },
    onError: (error) => {
      onUploadFailure?.(error);
    },
  });

  const createImagesMutation = useMutation<unknown, Error, Omit<Media, "id">[]>(
    {
      mutationFn: (images: Omit<Media, "id">[]) => {
        return sdk.client.fetch(`/admin/medias/${id}/images`, {
          method: "POST",
          body: {
            files: images,
          },
        }) as Promise<unknown>;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["medias", id] });
        onCreateSuccess?.();
      },
    },
  );

  const updateImagesMutation = useMutation<
    unknown,
    Error,
    { id: string; type: "thumbnail" | "image" }[]
  >({
    mutationFn: (updates: { id: string; type: "thumbnail" | "image" }[]) => {
      return sdk.client.fetch(`/admin/medias/${id}/images/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          updates,
        },
      }) as Promise<unknown>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medias", id] });
      // toast.success(t("gallery.file.update.success"))
      onUpdateSuccess?.();
    },
  });

  const deleteImagesMutation = useMutation<unknown, Error, string[]>({
    mutationFn: (ids: string[]) => {
      return sdk.client.fetch(`/admin/medias/${id}/images/batch`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          ids,
        },
      }) as Promise<unknown>;
    },
    onSuccess: (_data, deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ["medias", id] });
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
