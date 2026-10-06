import { Photo } from "@medusajs/icons";
import { Button, toast } from "@medusajs/ui";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useLabels } from "../hooks/use-labels";
import { useSdk } from "../../common/context";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";

/** Square image preview, or a placeholder icon when there is no URL. */
export function ImageThumbnail({ url, size = "small" }: { url?: string | null; size?: "small" | "large" }) {
  // Inline size: the host admin's Tailwind build may not scan this package.
  const px = size === "small" ? 32 : 96;
  return (
    <div
      style={{ width: px, height: px }}
      className="bg-ui-bg-component border-ui-border-base flex shrink-0 items-center justify-center overflow-hidden rounded-md border"
    >
      {url ? (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Photo className="text-ui-fg-muted" />
      )}
    </div>
  );
}

type ImageFieldProps = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

/**
 * Form widget for an image URL field: uploads the picked file through Medusa's
 * file module (`POST /admin/uploads`) and stores the returned URL.
 */
export function ImageField({ value, onChange, disabled }: ImageFieldProps) {
  const sdk = useSdk();
  const labels = useLabels();
  const input = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => sdk.admin.upload.create({ files: [file] }),
    onSuccess: ({ files }) => onChange(files[0]?.url ?? null),
    onError: (error: Error) => toast.error(error.message),
  });

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) upload.mutate(file);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="flex items-center gap-x-4">
      <ImageThumbnail url={value} size="large" />
      <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files)} />
      <div className="flex gap-x-2">
        <Button
          type="button"
          size="small"
          variant="secondary"
          disabled={disabled}
          isLoading={upload.isPending}
          onClick={() => input.current?.click()}
        >
          {value ? labels.ui("replace") : labels.ui("upload")}
        </Button>
        {value && (
          <Button
            type="button"
            size="small"
            variant="transparent"
            disabled={disabled || upload.isPending}
            onClick={() => onChange(null)}
          >
            {labels.action("remove")}
          </Button>
        )}
      </div>
    </div>
  );
}
