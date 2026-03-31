import { AdminUserListResponse } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { sdk } from "@repo/dashboard/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/dashboard/types/query";
import { zodQueryResolve } from "@repo/dashboard/utils/zod";
import { memo } from "react";
import { UserSchema } from "../../../../modules/authz/schema";
import DataTable from "@repo/dashboard/components/data-table";

type User = z.infer<typeof UserSchema>;

const fetchUsers = (signal: AbortSignal, params?: PageQueryParams) => {
    return sdk.client
        .fetch<AdminUserListResponse>("/admin/users", {
            method: "GET",
            signal,
            query: {
                ...(params || {}),
                fields: zodQueryResolve(UserSchema),
            },
        })
        .then(
            (res) =>
                ({
                    data: res.users.map((user) => ({
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                    })),
                    metadata: {
                        count: res.count,
                        skip: res.offset,
                        take: res.limit,
                    },
                }) as PageResponse<User>,
        );
};


const UsersDataTable = (props: any) => {
    return (
        <DataTable
            name="users"
            schema={UserSchema}
            queryFn={fetchUsers}
            fields={{
                id: {
                    hideLabel: true
                },
                email: {
                    label: "Email",
                },
                first_name: {
                    label: "First Name",
                },
                last_name: {
                    label: "Last Name",
                },
            }}
            {...props}
        />
    );
}

export default memo(UsersDataTable);    
