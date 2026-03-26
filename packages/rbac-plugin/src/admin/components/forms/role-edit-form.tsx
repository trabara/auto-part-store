import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, Input, Label, Text } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { sdk } from "../../lib/sdk";

const EditRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_default: z.boolean(),
  policies: z
    .array(
      z.object({
        permission_id: z.string(),
        name: z.enum(["ALLOW", "DENY"]),
      }),
    )
    .default([]),
});

type EditRoleFormData = z.infer<typeof EditRoleSchema>;

interface Permission {
  id: string;
  kind: string;
  target: string;
  type: string;
}

interface Policy {
  permission_id: string;
  name: "ALLOW" | "DENY";
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  policies: Policy[];
}

interface RoleEditFormProps {
  roleId: string;
  onClose: () => void;
}

export const RoleEditForm = ({ roleId, onClose }: RoleEditFormProps) => {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<{
    [key: string]: "ALLOW" | "DENY";
  }>({});

  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ["rbac-role", roleId],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/rbac/roles/${roleId}`);
      return response as { role: Role };
    },
  });

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["rbac-permissions-all"],
    queryFn: async () => {
      const response = await sdk.client.fetch(
        "/admin/rbac/permissions?limit=100",
      );
      return response as { permissions: Permission[] };
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditRoleFormData>({
    resolver: zodResolver(EditRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      is_default: false,
      policies: [],
    },
  });

  useEffect(() => {
    if (roleData?.role) {
      const role = roleData.role;
      reset({
        name: role.name,
        description: role.description || "",
        is_default: role.is_default,
        policies: role.policies,
      });

      const initialPerms: { [key: string]: "ALLOW" | "DENY" } = {};
      role.policies.forEach((p) => {
        initialPerms[p.permission_id] = p.name;
      });
      setSelectedPermissions(initialPerms);
    }
  }, [roleData, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditRoleFormData) => {
      const policies = Object.entries(selectedPermissions).map(
        ([permission_id, name]) => ({
          permission_id,
          name,
        }),
      );

      await sdk.client.fetch(`/admin/rbac/roles/${roleId}`, {
        method: "PUT",
        body: { ...data, policies },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
      onClose();
    },
  });

  const onSubmit = (data: EditRoleFormData) => {
    updateMutation.mutate(data);
  };

  const togglePermission = (permissionId: string) => {
    const current = selectedPermissions[permissionId];
    if (current === "ALLOW") {
      setSelectedPermissions((prev) => ({ ...prev, [permissionId]: "DENY" }));
    } else if (current === "DENY") {
      const { [permissionId]: _, ...rest } = selectedPermissions;
      setSelectedPermissions(rest);
    } else {
      setSelectedPermissions((prev) => ({ ...prev, [permissionId]: "ALLOW" }));
    }
  };

  const permissions = permissionsData?.permissions || [];

  if (roleLoading || permissionsLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input {...register("name")} id="name" />
        {errors.name && (
          <Text className="text-ui-fg-error mt-1">{errors.name.message}</Text>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input {...register("description")} id="description" />
        {errors.description && (
          <Text className="text-ui-fg-error mt-1">
            {errors.description.message}
          </Text>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox {...register("is_default")} id="is_default" />
        <Label htmlFor="is_default">Default Role</Label>
      </div>

      <div>
        <Text size="small" weight="plus" className="mb-2 block">
          Permissions
        </Text>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {permissions.map((perm) => (
            <div
              key={perm.id}
              className="flex items-center gap-2 p-2 bg-ui-bg-subtle rounded"
            >
              <Checkbox
                checked={!!selectedPermissions[perm.id]}
                onCheckedChange={() => togglePermission(perm.id)}
              />
              <Text size="small" className="flex-1">
                {perm.target}
              </Text>
              <Text size="small" className="text-ui-fg-subtle capitalize">
                {perm.kind}
              </Text>
              {selectedPermissions[perm.id] && (
                <Text
                  size="small"
                  className={
                    selectedPermissions[perm.id] === "ALLOW"
                      ? "text-ui-fg-success"
                      : "text-ui-fg-error"
                  }
                >
                  {selectedPermissions[perm.id]}
                </Text>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
