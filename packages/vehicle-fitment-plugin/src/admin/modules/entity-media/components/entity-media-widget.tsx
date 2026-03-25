import { ThumbnailBadge } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { EntityImage } from "../../../../modules/entity-media/schema"
import { sdk } from "../../../lib/sdk"
import { EntityMediaModal } from "../components/entity-media-modal"

type EntityImagesResponse = {
    images: EntityImage[]
}

type EntityMediaWidgetProps = {
    entityId: string,
    entityName: string
}

export default function EntityMediaWidget({ entityId, entityName }: EntityMediaWidgetProps) {
    const { t } = useTranslation()

    const { data: response, isLoading } = useQuery({
        queryKey: [`medias-images`, entityId],
        queryFn: async () => {
            const result = await sdk.client.fetch<EntityImagesResponse>(
                `/admin/medias/${entityId}/images`
            )
            return result
        },
    })

    const images = response?.images || []

    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">{t("media.gallery.heading")}</Heading>
                <EntityMediaModal id={entityId} entityName={entityName} existingImages={images} />
            </div>
            <div className="px-6 py-4">
                <div className="grid grid-cols-[repeat(auto-fill,96px)] gap-4">
                    {isLoading && (
                        <div className="col-span-full">
                            <p className="text-ui-fg-subtle text-sm">{t("media.gallery.loading")}</p>
                        </div>
                    )}
                    {!isLoading && images.length === 0 && (
                        <div className="col-span-full">
                            <p className="text-ui-fg-subtle text-sm">{t("media.gallery.no_images")}</p>
                        </div>
                    )}
                    {images.map((image: EntityImage) => (
                        <div
                            key={image.id}
                            className="relative aspect-square overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle"
                        >
                            <img
                                src={image.url}
                                alt={`${entityName} ${image.type}`}
                                className="h-full w-full object-cover"
                            />
                            {image.type === "thumbnail" && (
                                <div className="absolute top-2 left-2">
                                    <ThumbnailBadge />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </Container>
    )
}
