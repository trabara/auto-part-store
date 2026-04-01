import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/dashboard/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/dashboard/types/config";
import { CreatePermissionSchema, PermissionSchema, UpdatePermissionSchema } from "../../../../modules/authz/schema";
import CategorySelect from "../components/category-select";

const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof PermissionSchema>> = {
    target: {
        label: "Target",
        description: "The resource this permission applies to, e.g. 'products' or 'orders'",
    },
    kind: {
        label: "Kind",
        description: "The type of permission, e.g. 'read' or 'write'",
    },
    type: {
        label: "Type",
        description: "Whether the permission is predefined or custom",
    },
};

const CATEGORY_FIELDS: MedusaFieldOverrides<z.infer<typeof UpdatePermissionSchema>> = {
    category_id: {
        label: "Category",
        description: "The category this permission belongs to",
        render: ({ value, onChange }) => <CategorySelect defaultValue={value} onChange={(id) => onChange(id)} />,
    },
};

export default function PermissionsPage() {
    return <MedusaPage
        id="permission"
        path="/admin/rbac/v2/permissions"
        title="Permissions"
        description="Manage permissions for user roles"
        schema={PermissionSchema}
        fields={{
            ...BASE_FIELDS,
            category: {
                label: "Category",
                description: "The category this permission belongs to",
                cell: (info) => <span>{info.getValue()?.name}</span>,
            }
        }}
        create={{
            id: 'permission',
            title: "Create Permission",
            description: "Create a new permission",
            schema: CreatePermissionSchema,
            fields: {
                ...BASE_FIELDS,
                ...CATEGORY_FIELDS,
            }
            
        }}
        edit={{
            id: "permission",
            schema: UpdatePermissionSchema,
            title: "Edit Permission",
            description: "Edit the permission",
            fields: {
                ...BASE_FIELDS,
                ...CATEGORY_FIELDS,
            }

        }}
    />;
}

export const handle = {
  breadcrumb: () => 'Permissions'
};

export const config = defineRouteConfig({
    label: "Permissions",
});