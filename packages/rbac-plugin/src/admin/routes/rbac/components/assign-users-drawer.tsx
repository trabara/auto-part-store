import { AdminUserListResponse } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { User } from "@medusajs/icons";
import { Button, Drawer, Heading, Hint, toast } from "@medusajs/ui";
import DataTable from "@repo/dashboard/components/data-table";
import { sdk } from "@repo/dashboard/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/dashboard/types/query";
import { zodQueryResolve } from "@repo/dashboard/utils/zod";
import { useMutation } from "@tanstack/react-query";
import { memo, useRef, useState } from "react";
import {
  AssignUsersInput,
  MemberSchema,
  UserSchema
} from "../../../../modules/authz/schema";
import {} from '@repo/ui/hooks/use-as-ref';
import { useAsRef } from "@repo/ui/hooks/use-as-ref";
type User = z.infer<typeof UserSchema>;
type Member = z.infer<typeof MemberSchema>;

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
  members: Member[];
}


function AssignUsersDrawer({
  roleId,
  members
}: AssignUsersDrawerProps) {
  const userIds = useAsRef(members.map((m) => m.user_id));

  const mutation = useMutation({
    mutationFn: (input: AssignUsersInput) => assignUsersToRole(roleId, input),
    onSuccess: () => {
      toast.success("Users assigned successfully");
    },
    onError: () => {
      toast.error("Failed to assign users");
    },
  });

  return (
    <Drawer>
      <Drawer.Trigger asChild>
        <Button variant="transparent" size="small" className="w-full justify-start [&_svg]:text-ui-fg-subtle flex items-center gap-x-2">
          <User />
          Assign Users
        </Button>
      </Drawer.Trigger>
      <Drawer.Content >
        <Drawer.Header>
          <Drawer.Title>
            <Heading level="h2">Assign Users</Heading>
            <Hint>Select users to assign to the role</Hint>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="!px-0 !py-0">
          <DataTable
            name="users"
            schema={UserSchema}
            queryFn={fetchUsers}
            selectedIds={userIds.current}
            onRowSelectChange={(users) => {
              userIds.current = users.map((u) => u.id);
            }}
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
          />
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Close</Button>
          </Drawer.Close>
          <Button onClick={() => mutation.mutate({ userIds: userIds.current })}>Assign</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

export default memo(AssignUsersDrawer);
