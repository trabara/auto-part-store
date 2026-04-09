import { Button, Drawer, Heading, Hint, toast, usePrompt } from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { useAsRef } from "@repo/hooks";
import { useMutation } from "@tanstack/react-query";
import { CreatePolicyInput, Policy, Role } from "@trabara/core/dtos";
import { Lock } from "lucide-react";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import PermissionDataTable from "./permission-data-table";

type UpdateRolePoliciesInput = {
  permissions: string[];
};

const updateRolePolicies = (roleId: string, input: UpdateRolePoliciesInput) => {
  return sdk.client.fetch(`/admin/rbac/v2/roles/${roleId}/policies`, {
    method: "PATCH",
    body: input,
  });
};

interface EditRolePermissionsDrawerProps {
  role: Role
}

function EditRolePermissionsDrawer({
  role
}: EditRolePermissionsDrawerProps) {
  const { t } = useTranslation();
  const initialPermissionIds = role.policies
    .map((p: Policy) => p.permission?.id)
    .filter(Boolean);
  const permissionIdsRef = useAsRef<string[]>(initialPermissionIds);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const prompt = usePrompt();

  const updatePoliciesMutation = useMutation({
    mutationFn: (input: UpdateRolePoliciesInput) =>
      updateRolePolicies(role.id, input),
    onSuccess: () => {
      toast.success(t("role.editPermissions.toast.success"));
    },
    onError: () => {
      toast.error(t("role.editPermissions.toast.error"));
    },
  });

  const handleSaveClick = async () => {
    const confirmed = await prompt({
      title: t("role.editPermissions.confirm.title"),
      description: t("role.editPermissions.confirm.description"),
      confirmText: t("role.editPermissions.confirm.yes"),
      cancelText: t("role.editPermissions.confirm.no"),
      variant: "confirmation",
    });
    if (!confirmed) return;

    await updatePoliciesMutation.mutateAsync({
      permissions: permissionIdsRef.current,
    });
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
          <Lock />
          {t("role.action.editPermissions")}
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            <Heading level="h2">{t("role.editPermissions.title")}</Heading>
            <Hint>{t("role.editPermissions.hint")}</Hint>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="!px-0 !py-0">
          <PermissionDataTable
            className="absolute inset-0"
            defaultValues={role.policies}
            onChange={(policies: CreatePolicyInput[]) => {
              permissionIdsRef.current = policies.map((p) => p.permission_id);
            }}
          />
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">
              {t("role.editPermissions.close")}
            </Button>
          </Drawer.Close>
          <Button
            onClick={handleSaveClick}
            isLoading={updatePoliciesMutation.isPending}
            disabled={updatePoliciesMutation.isPending}
          >
            {t("role.editPermissions.save")}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

export default memo(EditRolePermissionsDrawer);
