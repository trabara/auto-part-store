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
import { useNavigate } from "react-router-dom";
import { UpdateMakeInput, UpdateMakeInputSchema } from "../../../../../modules/fitment/schema";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { updateMake } from "../data";
import { MakeWithModels } from "../types";

const MakeEdit = ({ make }: { make?: MakeWithModels }) => {
  const navigate = useNavigate();

  const form = useForm<UpdateMakeInput>({
    resolver: zodResolver(UpdateMakeInputSchema),
  });

  useEffect(() => {
    if (make) {
      form.reset({
        name: make.name,
      });
    }
  }, [make, form]);

  const updateMutation = useUpdateMutation({
    invalidateKeys: ["makes"],
    errorMessage: "Failed to update make. Please try again.",
    successMessage: "Make updated successfully.",
    updateFn: updateMake(make?.id),
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
          <Heading level="h2">Edit Make</Heading>
          <p className="text-ui-fg-subtle text-sm mt-1">
            Update make information
          </p>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  Make ID
                </Label>
                <Input id="id" value={make?.id} disabled />
              </div>

              {/* Editable Name */}
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      Make Name <span className="text-ui-fg-error">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Toyota, Ford, Honda"
                      aria-invalid={!!fieldState.error}
                      autoFocus
                      {...field}
                    />
                    {fieldState.error && (
                      <Hint variant="error">{fieldState.error.message}</Hint>
                    )}
                  </div>
                )}
              />

              {/* Model Count Info */}
              {make?.models && make.models.length > 0 && (
                <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                  <p className="text-sm text-ui-fg-subtle">
                    This make has <strong>{make.models.length}</strong>{" "}
                    {make.models.length === 1 ? "model" : "models"} associated
                    with it.
                  </p>
                </div>
              )}
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

export default MakeEdit;
