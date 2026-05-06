"use client";

import { useRef, useState } from "react";
import { Button, Text, toast } from "@medusajs/ui";
import { ArrowUpTray, Trash } from "@medusajs/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@repo/admin/lib/sdk";

type LogoSectionProps = {
  logoUrl: string | null;
  storeDetailsId: string | null;
};

export function LogoSection({ logoUrl, storeDetailsId }: LogoSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Upload file to storage
      const { files: uploaded } = await sdk.admin.upload.create({
        files: [file],
      });
      const uploadedFile = uploaded[0];

      if (!storeDetailsId) return uploadedFile.url;

      // 2. Remove any existing thumbnail first
      const { medias: existing } = await sdk.client.fetch<{
        medias: { id: string }[];
      }>(`/admin/medias/${storeDetailsId}/images`);

      const thumbnailIds = existing.map((m) => m.id);
      if (thumbnailIds.length > 0) {
        await sdk.client.fetch(`/admin/medias/${storeDetailsId}/images/batch`, {
          method: "DELETE",
          body: { ids: thumbnailIds },
        });
      }

      // 3. Register new thumbnail in MediaModule
      await sdk.client.fetch(`/admin/medias/${storeDetailsId}/images`, {
        method: "POST",
        body: {
          files: [
            {
              file_id: uploadedFile.id,
              url: uploadedFile.url,
              type: "thumbnail",
            },
          ],
        },
      });

      return uploadedFile.url;
    },
    onSuccess: (url) => {
      setPreview(url ?? null);
      queryClient.invalidateQueries({ queryKey: ["store-details"] });
      toast.success("Logo uploaded");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to upload logo");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!storeDetailsId) return;

      const { medias } = await sdk.client.fetch<{ medias: { id: string }[] }>(
        `/admin/medias/${storeDetailsId}/images`,
      );

      if (medias.length === 0) return;

      await sdk.client.fetch(`/admin/medias/${storeDetailsId}/images/batch`, {
        method: "DELETE",
        body: { ids: medias.map((m) => m.id) },
      });
    },
    onSuccess: () => {
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["store-details"] });
      toast.success("Logo removed");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to remove logo");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    e.target.value = "";
  };

  const isPending = uploadMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex items-center gap-x-4">
      <div className="bg-ui-bg-subtle border-ui-border-base flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        {preview ? (
          <img
            src={preview}
            alt="Store logo"
            className="h-full w-full object-contain"
          />
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            No logo
          </Text>
        )}
      </div>

      <div className="flex items-center gap-x-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          size="small"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          isLoading={uploadMutation.isPending}
        >
          <ArrowUpTray />
          Upload Logo
        </Button>
        {preview && (
          <Button
            size="small"
            variant="secondary"
            onClick={() => removeMutation.mutate()}
            disabled={isPending}
            isLoading={removeMutation.isPending}
          >
            <Trash />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
