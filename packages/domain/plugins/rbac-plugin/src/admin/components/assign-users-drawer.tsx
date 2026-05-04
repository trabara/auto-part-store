import { AdminUserListResponse } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { User } from "@medusajs/icons";
import { Button, Drawer, Heading, Hint, toast, usePrompt } from "@medusajs/ui";
import DataTable from "@repo/admin/components/data-table";
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { zodQueryResolve } from "@repo/admin/utils/zod";
import { useAsRef } from "@repo/hooks";
import { useMutation } from "@tanstack/react-query";
import { AssignUsersInput, Role } from "@trabara/core/dtos";
import { UserSchema } from "@trabara/core/schemas";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

type User = z.infer<typeof UserSchema>;

const assignUsersToRole = (roleId: string, input: AssignUsersInput) => sdk.client.fetch(`/admin/rbac/v2/roles/${roleId}/assign`, {
  method: "POST",
  body: input,
});

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

interface AssignUsersDrawerProps {
  role: Role;
}

function AssignUsersDrawer({ role }: AssignUsersDrawerProps) {
  const { t } = useTranslation();
  const initialUserIds = role.members.map((m: any) => m.user_id);
  const userIdsRef = useAsRef(initialUserIds);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const prompt = usePrompt();

  const assignUsersMutation = useMutation({
    mutationFn: (input: AssignUsersInput) => assignUsersToRole(role.id, input),
    onSuccess: () => {
      toast.success(t("role.assignUsers.toast.success"));
    },
    onError: () => {
      toast.error(t("role.assignUsers.toast.error"));
    },
  });

  const handleSaveClick = async () => {
    const confirmed = await prompt({
      title: t("role.assignUsers.confirm.title"),
      description: t("role.assignUsers.confirm.description"),
      confirmText: t("role.assignUsers.confirm.yes"),
      cancelText: t("role.assignUsers.confirm.no"),
      variant: "confirmation",
    });
    if (!confirmed) {
      return;
    }
    await assignUsersMutation.mutateAsync({ userIds: userIdsRef.current });
    setIsDrawerOpen(false);
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <Drawer.Trigger asChild>
        <Button
          variant="transparent"
          size="small"
          className="w-full justify-start [&_svg]:text-ui-fg-subtle flex items-center gap-x-2"
        >
          <User />
          {t("role.action.assignUsers")}
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            <Heading level="h2">{t("role.assignUsers.title")}</Heading>
            <Hint>{t("role.assignUsers.hint")}</Hint>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="!px-0 !py-0">
          <DataTable
            id="users"
            schema={UserSchema}
            queryFn={fetchUsers}
            selectedIds={userIdsRef.current}
            onRowSelectChange={(users) => {
              userIdsRef.current = users.map((u) => u.id);
            }}
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
          />
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">{t("role.assignUsers.close")}</Button>
          </Drawer.Close>
          <Button onClick={handleSaveClick}>
            {t("role.assignUsers.save")}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

export default memo(AssignUsersDrawer);
