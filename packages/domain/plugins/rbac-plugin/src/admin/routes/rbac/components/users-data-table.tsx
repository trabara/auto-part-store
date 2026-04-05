import { AdminUserListResponse } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { zodQueryResolve } from "@repo/admin/utils/zod";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { UserSchema } from "@trabara/core/schemas";
import DataTable from "@repo/admin/components/data-table";

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
  const { t } = useTranslation();
  return (
    <DataTable
      name="users"
      schema={UserSchema}
      queryFn={fetchUsers}
      fields={{
        id: {
          hideLabel: true,
        },
        email: {
          label: t("user.field.email"),
        },
        first_name: {
          label: t("user.field.firstName"),
        },
        last_name: {
          label: t("user.field.lastName"),
        },
      }}
      {...props}
    />
  );
};

export default memo(UsersDataTable);
