import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, Input, Label, Text } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateRoleInput, CreateRoleSchema, Permission } from '../../../modules/rbac/schema';
import { sdk } from "../../lib/sdk";


interface RoleCreateFormProps {
  onClose: () => void;
}

export const RoleCreateForm = ({ onClose }: RoleCreateFormProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      is_default: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      await sdk.client.fetch("/admin/rbac/roles", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
      onClose();
    },
  });

  const onSubmit = (data: CreateRoleInput) => {
    createMutation.mutate(data);
  };

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

    </form>
  );
};
