import { Select } from "@medusajs/ui";
import { sdk } from "@repo/dashboard/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/dashboard/types/query";
import { useQuery } from "@tanstack/react-query";
import { Category } from "../../../../modules/authz/schema";

const listCategories = (signal: AbortSignal, params?: PageQueryParams) => {
    return sdk.client.fetch<PageResponse<Category>>("/admin/rbac/v2/categories", {
        method: "GET",
        signal,
        query: {
            ...(params || {}),
            fields: 'id,name',
        },
    }).then(({ data }) => data.map((category) => ({
        label: category.name,
        value: category.id,
    })));
}

export default function CategorySelect({ defaultValue, onChange }: { defaultValue?: string, onChange?: (value: string) => void }) {
    const { data: categories } = useQuery(
        {
            queryKey: ["categories"],
            queryFn: ({ signal }) => listCategories(signal, { limit: 100, offset: 0, order: 'name' }),
        }
    );
    return <Select value={defaultValue} onValueChange={onChange}>
        <Select.Trigger>
            <Select.Value placeholder="Select a category" />
        </Select.Trigger>
        <Select.Content>
            {categories?.map((category) => (
                <Select.Item key={category.value} value={category.value}>
                    {category.label}
                </Select.Item>
            ))}
        </Select.Content>
    </Select>
}