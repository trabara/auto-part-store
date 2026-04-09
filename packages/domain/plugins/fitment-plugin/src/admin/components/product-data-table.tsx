import { AdminProduct, AdminProductListResponse } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { Badge, Button, clx, Drawer } from "@medusajs/ui";
import DataTable from "@repo/admin/components/data-table";
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { Fitment } from "@trabara/core/dtos";
import { Link } from "lucide-react";
import { useProductLinkage } from "../hooks/use-product-linkage";

const Schema = z.object({
    title: z.string(),
    link_status: z.enum(['linked', 'unlinked']),
})

type ProductWithFitments = AdminProduct & {
    link_status: 'linked' | 'unlinked';
    fitments: Fitment[];
}

export function listProductsWithFitments(signal: AbortSignal, params: PageQueryParams): Promise<PageResponse<ProductWithFitments>> {
    return sdk.client.fetch<AdminProductListResponse>(
        `/admin/products`,
        {
            signal,
            query: {
                ...params,
                fields: "+fitments.id"
            },
        },
    ).then((resp) => ({
        data: resp.products as ProductWithFitments[],
        metadata: {
            count: resp.count,
            skip: resp.offset,
            take: resp.limit,
        }
    }));
}

export default function ProductDataTable({ fitment }: { fitment: Fitment }) {

    const { handleLinkProduct, handleUnlinkProduct } = useProductLinkage()
    return <Drawer>
        <Drawer.Trigger asChild>
            <Button
                variant="transparent"
                size="small"
                className="w-full justify-start [&_svg]:text-ui-fg-subtle flex items-center gap-x-2"
            >
                <Link size={15} />
                Link Products
            </Button>
        </Drawer.Trigger>
        <Drawer.Content>
            <Drawer.Header>
            </Drawer.Header>
            <Drawer.Body className="!p-0">
                <DataTable
                    id="products"
                    title="Products"
                    schema={Schema}
                    queryFn={listProductsWithFitments}
                    rowActions={[
                        {
                            id: "link",
                            label: "Link/Unlink",
                            icon: <Link size={15} />,
                            onClick: (product) => {
                                const isLinked = product.fitments?.some((f) => f.id === fitment.id);
                                if (isLinked) {
                                    handleUnlinkProduct(fitment.id, product.id)
                                } else {
                                    handleLinkProduct(fitment.id, product.id)
                                }
                            },
                        },
                    ]}
                    fields={{
                        title: {
                            label: "Title"
                        },
                        link_status: {
                            label: "Status",
                            cell: (info) => {
                                const product = info.row.original;
                                const isLinked = product.fitments?.some((f) => f.id === fitment.id);
                                return (
                                    <Badge className={clx("text-xs font-medium", {
                                        "text-green-600": isLinked,
                                        "text-red-600": !isLinked,
                                    })}>
                                        {isLinked ? 'Linked' : 'Unlinked'}
                                    </Badge>
                                );
                            }
                        }


                    }}
                />
            </Drawer.Body>
        </Drawer.Content>
    </Drawer>
}