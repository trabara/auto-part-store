import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Drawer,
  Heading,
  Hint,
  Input,
  Label
} from "@medusajs/ui";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  useNavigate
} from "react-router-dom";
import { MakesSelectInput } from "~/admin/components/makes-select-input";
import { useUpdateMutation } from "~/admin/hooks/use-update-mutation";
import { sdk } from "~/admin/lib/sdk";
import { Model, UpdateModelInput, UpdateModelSchema } from "~/modules/fitment/schema";


const ModelEdit = ({ model }: { model?: Model }) => {
  const navigate = useNavigate();

  const form = useForm<UpdateModelInput>({
    resolver: zodResolver(UpdateModelSchema),
    defaultValues: {
      name: model?.name,
      make_id: model?.make.id,
    },
  });

  useEffect(() => {
    if (model) {
      form.reset({
        name: model.name,
        make_id: model.make.id,
      });
    }
  }, [model, form]);

  const updateMutation = useUpdateMutation({
    invalidateKeys: ["models"],
    successMessage: "Model updated successfully",
    errorMessage: "Failed to update model",
    updateFn: (data) =>
      sdk.client.fetch(`/admin/models/${model?.id}`, {
        method: "PUT",
        body: data,
      }),
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
                <Input id="id" value={model?.id} disabled />
              </div>

              {/* Make Select */}
              <Controller
                control={form.control}
                name="make_id"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="make_id" className="font-medium">
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
