import { Button, CommandBar, FocusModal, Heading, toast } from "@medusajs/ui";
import { UploadedFile, Media } from "@trabara/core/dtos";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMediaMutations } from "../hooks/use-media";
import { ImageGallery } from "./image-gallery";
import { ImageUpload } from "./image-upload";
type MediaModalProps = {
  id: string;
  entityName: string;
  existingImages: Media[];
};

export const MediaModal = ({
  id,
  entityName,
  existingImages,
}: MediaModalProps) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentThumbnailId, setCurrentThumbnailId] = useState<string | null>(
    null,
  );
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set(),
  );
  const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    uploadFilesMutation,
    createImagesMutation,
    updateImagesMutation,
    deleteImagesMutation,
  } = useMediaMutations({
    id,
    onCreateSuccess: () => {
      setOpen(false);
      resetModalState();
    },
    onUpdateSuccess() {
      setSelectedImageIds(new Set());
    },
    onDeleteSuccess: (deletedIds) => {
      setSelectedImageIds(new Set());
      if (currentThumbnailId && deletedIds.includes(currentThumbnailId)) {
        setCurrentThumbnailId(null);
      }
    },
  });

  const isSaving =
    createImagesMutation.isPending ||
    updateImagesMutation.isPending ||
    deleteImagesMutation.isPending;

  const resetModalState = () => {
    setUploadedFiles([]);
    setCurrentThumbnailId(null);
    setSelectedImageIds(new Set());
    setImagesToDelete(new Set());
  };

  const handleImageSelection = (id: string, isUploaded: boolean = false) => {
    const itemId = isUploaded ? `uploaded:${id}` : id;
    const newSelected = new Set(selectedImageIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedImageIds(newSelected);
  };

  const handleSetAsThumbnail = () => {
    if (selectedImageIds.size !== 1) {
      return;
    }

    const selectedId = Array.from(selectedImageIds)[0]!;
    setCurrentThumbnailId(selectedId);
    if (selectedId && selectedId.startsWith("uploaded:")) {
      // update uploaded file type to thumbnail
      const uploadedFileId = selectedId.replace("uploaded:", "");
      setUploadedFiles((prev) =>
        prev.map((file) => {
          return file.id === uploadedFileId
            ? { ...file, type: "thumbnail" }
            : file;
        }),
      );
    }

    setSelectedImageIds(new Set());
  };

  const initializeThumbnail = () => {
    const thumbnailImage = existingImages.find(
      (img) => img.type === "thumbnail",
    );
    if (thumbnailImage?.id) {
      setCurrentThumbnailId(thumbnailImage.id);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      initializeThumbnail();
    } else {
      resetModalState();
    }
  };

  const handleUploadFile = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const filesArray = Array.from(files);

    uploadFilesMutation.mutate(filesArray, {
      onSuccess: (data) => {
        setUploadedFiles((prev) => [
          ...prev,
          ...(data.files as UploadedFile[]),
        ]);
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const hasNewImages = uploadedFiles.length > 0;
    const hasImagesToDelete = imagesToDelete.size > 0;

    const initialThumbnail = existingImages.find(
      (img) => img.type === "thumbnail",
    );
    const thumbnailChanged =
      currentThumbnailId &&
      !currentThumbnailId.startsWith("uploaded:") &&
      currentThumbnailId !== initialThumbnail?.id;

    if (!hasNewImages && !hasImagesToDelete && !thumbnailChanged) {
      setOpen(false);
      return;
    }

    try {
      const operations: Array<Promise<unknown>> = [];
      if (hasNewImages) {
        const imagesToCreate = uploadedFiles.map((file) => ({
          url: file.url,
          file_id: file.id,
          type:
            file.type ||
            (currentThumbnailId === `uploaded:${file.id}`
              ? "thumbnail"
              : "image"),
        }));
        operations.push(
          createImagesMutation.mutateAsync(
            imagesToCreate as Omit<Media, "id">[],
          ),
        );
      }

      // Update thumbnail if changed and it's not an uploaded file
      if (
        thumbnailChanged &&
        !(hasNewImages && currentThumbnailId?.startsWith("uploaded:"))
      ) {
        const updates = [
          {
            id: currentThumbnailId,
            type: "thumbnail" as const,
          },
        ];
        operations.push(updateImagesMutation.mutateAsync(updates));
      }

      if (hasImagesToDelete) {
        const idsToDelete = Array.from(imagesToDelete);
        operations.push(deleteImagesMutation.mutateAsync(idsToDelete));
      }

      await Promise.all(operations);

      queryClient.invalidateQueries({ queryKey: [`medias-images`, id] });
      setOpen(false);
      resetModalState();
      toast.success("Category media saved successfully");
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  const handleDelete = () => {
    if (selectedImageIds.size === 0) {
      return;
    }

    const uploadedFileIds: string[] = [];
    const savedImageIds: string[] = [];

    selectedImageIds.forEach((id) => {
      if (id.startsWith("uploaded:")) {
        uploadedFileIds.push(id.replace("uploaded:", ""));
      } else {
        savedImageIds.push(id);
      }
    });

    if (uploadedFileIds.length > 0) {
      setUploadedFiles((prev) =>
        prev.filter((file) => !uploadedFileIds.includes(file.id!)),
      );
      if (currentThumbnailId?.startsWith("uploaded:")) {
        const thumbnailFileId = currentThumbnailId.replace("uploaded:", "");
        if (uploadedFileIds.includes(thumbnailFileId)) {
          setCurrentThumbnailId(null);
        }
      }
    }

    if (savedImageIds.length > 0) {
      setImagesToDelete((prev) => {
        const newSet = new Set(prev);
        savedImageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
      if (currentThumbnailId && savedImageIds.includes(currentThumbnailId)) {
        setCurrentThumbnailId(null);
      }
    }

    setSelectedImageIds(new Set());
  };

  return (
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      <FocusModal.Trigger asChild>
        <Button size="small" variant="secondary">
          {t("common.edit")}
        </Button>
      </FocusModal.Trigger>

      <FocusModal.Content>
        <FocusModal.Header>
          <Heading>{t("media.modal.title", { entityName })}</Heading>
        </FocusModal.Header>

        <FocusModal.Body className="flex h-full overflow-hidden">
          <div className="flex w-full h-full flex-col-reverse lg:grid lg:grid-cols-[1fr_560px]">
            <ImageGallery
              existingImages={existingImages}
              imagesToDelete={imagesToDelete}
              uploadedFiles={uploadedFiles}
              currentThumbnailId={currentThumbnailId}
              selectedImageIds={selectedImageIds}
              onToggleSelect={handleImageSelection}
            />
            <ImageUpload
              fileInputRef={fileInputRef}
              isUploading={uploadFilesMutation.isPending}
              onFileSelect={handleUploadFile}
            />
          </div>
          <CommandBar open={selectedImageIds.size > 0}>
            <CommandBar.Bar>
              <CommandBar.Value>
                {selectedImageIds.size}{" "}
                {t("media.command.selected", { count: selectedImageIds.size })}
              </CommandBar.Value>
              <CommandBar.Seperator />
              <CommandBar.Command
                action={handleSetAsThumbnail}
                label={t("media.command.setThumbnail")}
                shortcut="t"
                disabled={selectedImageIds.size !== 1}
              />
              <CommandBar.Seperator />
              <CommandBar.Command
                action={handleDelete}
                label={t("common.delete")}
                shortcut="d"
              />
            </CommandBar.Bar>
          </CommandBar>
        </FocusModal.Body>
        <FocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <FocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("common.cancel")}
              </Button>
            </FocusModal.Close>
            <Button size="small" onClick={handleSave} isLoading={isSaving}>
              {t("common.save")}
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};
