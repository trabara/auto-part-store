import { useEffect } from "react";
import {
  useNavigate,
  LoaderFunctionArgs,
  useLoaderData,
} from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Drawer,
  Heading,
  Hint,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { z } from "@medusajs/framework/zod";
import { sdk } from "~/lib/sdk";
import { MakesSelectInput } from "~/components/makes-select-input";
import { Model } from "~/modules/fitment/schema";

const UpdateModelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  make_name: z.string().min(1, "Make is required"),
});

type UpdateModelInput = z.infer<typeof UpdateModelSchema>;

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { model } = await sdk.client.fetch<{ model: Model }>(
    `/admin/models/${id}`,
    {
      query: { fields: "*make" },
    },
  );
  return { model };
}

const ModelEdit = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { model } = useLoaderData() as { model: Model };

  const form = useForm<UpdateModelInput>({
    resolver: zodResolver(UpdateModelSchema),
    defaultValues: {
      name: model.name,
      make_name: model.make.name,
    },
  });

  useEffect(() => {
    if (model) {
      form.reset({
        name: model.name,
        make_name: model.make.name,
      });
    }
  }, [model, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateModelInput) => {
      // Transform to API format: { name, make: { name } }
      return sdk.client.fetch(`/admin/models/${model.id}`, {
        method: "PATCH",
        body: {
          name: data.name,
          make: { name: data.make_name },
        },
      });
    },
    onSuccess: () => {
      toast.success("Model updated successfully");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update model");
    },
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  return (
    <Drawer open onOpenChange={handleClose}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading level="h2">Edit Model</Heading>
          <p className="text-ui-fg-subtle text-sm mt-1">
            Update model information
          </p>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  Model ID
                </Label>
                <Input id="id" value={model.id} disabled />
              </div>

              {/* Make Select */}
              <Controller
                control={form.control}
                name="make_name"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="make_name" className="font-medium">
                      Make <span className="text-ui-fg-error">*</span>
                    </Label>
                    <MakesSelectInput
                      placeholder="Select or create a make"
                      error={fieldState.error?.message}
                      {...field}
                    />
                    {fieldState.error && (
                      <Hint variant="error">{fieldState.error.message}</Hint>
                    )}
                    <Hint>
                      Select an existing make or type a new one to create it
                    </Hint>
                  </div>
                )}
              />

              {/* Editable Name */}
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      Model Name <span className="text-ui-fg-error">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Camry, F-150, Civic"
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                    {fieldState.error && (
                      <Hint variant="error">{fieldState.error.message}</Hint>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-x-2 border-t pt-4 mt-6">
              <Button variant="secondary" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
};

export default ModelEdit;
