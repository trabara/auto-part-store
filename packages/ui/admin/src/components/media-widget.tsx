import { ThumbnailBadge } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Media } from "@trabara/core/dtos";
import { MediaModal } from "./media-modal";
import { sdk } from "../lib/sdk";

type MediasResponse = {
  medias: Media[];
};

type MediaWidgetProps = {
  entityId: string;
  entityName: string;
};

export default function MediaWidget({
  entityId,
  entityName,
}: MediaWidgetProps) {
  const { t } = useTranslation();

  const { data: response, isLoading } = useQuery({
    queryKey: ['medias', entityId],
    queryFn: () => sdk.client.fetch<MediasResponse>(
      `/admin/medias/${entityId}/images`,
    )
  });

  const medias = response?.medias || [];

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("media.gallery.heading")}</Heading>
        <MediaModal
          id={entityId}
          entityName={entityName}
          existingImages={medias}
        />
      </div>
      <div className="px-6 py-4">
        <div className="grid grid-cols-[repeat(auto-fill,96px)] gap-4">
          {isLoading && (
            <div className="col-span-full">
              <p className="font-normal font-sans txt-small text-ui-fg-muted">
                {t("media.gallery.loading")}
              </p>
            </div>
          )}
          {!isLoading && medias.length === 0 && (
            <div className="col-span-full">
              <p className="font-normal font-sans txt-small text-ui-fg-muted">
                {t("media.gallery.no_images")}
              </p>
            </div>
          )}
          {medias.map((media: Media) => (
            <div
              key={media.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle"
            >
              <img
                src={media.url}
                alt={`${entityName} ${media.type}`}
                className="h-full w-full object-cover"
              />
              {media.type === "thumbnail" && (
                <div className="absolute top-2 left-2">
                  <ThumbnailBadge />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
