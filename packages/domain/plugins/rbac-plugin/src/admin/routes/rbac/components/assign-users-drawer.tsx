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
import { memo, useState } from "react";
import { AssignUsersInput } from "@trabara/core/dtos";
import { UserSchema } from "@trabara/core/schemas";

type User = z.infer<typeof UserSchema>;

const assignUsersToRole = (roleId: string, input: AssignUsersInput) => {
  return sdk.client.fetch(`/admin/rbac/v2/roles/${roleId}/assign`, {
    method: "POST",
    body: input,
  });
};

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
  roleId: string;
  members: { user_id: string }[];
}

function AssignUsersDrawer({ roleId, members }: AssignUsersDrawerProps) {
  const initialUserIds = members.map((m) => m.user_id);
  const userIdsRef = useAsRef(initialUserIds);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const prompt = usePrompt();

  const assignUsersMutation = useMutation({
    mutationFn: (input: AssignUsersInput) => assignUsersToRole(roleId, input),
    onSuccess: () => {
      toast.success("Updated successfully");
    },
    onError: () => {
      toast.error("Failed to update users");
    },
  });

  const handleSaveClick = async () => {
    const confirmed = await prompt({
      title: `Confirm Updates`,
      description:
        "Are you sure you want to update the users assigned to this role?",
      confirmText: "Yes, Update",
      cancelText: "No, Cancel",
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
          Assign Users
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            <Heading level="h2">Assign Users</Heading>
            <Hint>Select users to assign to the role</Hint>
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
                label: "Email",
              },
              first_name: {
                label: "First Name",
              },
              last_name: {
                label: "Last Name",
              },
            }}
          />
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Close</Button>
          </Drawer.Close>
          <Button onClick={handleSaveClick}>Save</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

export default memo(AssignUsersDrawer);
