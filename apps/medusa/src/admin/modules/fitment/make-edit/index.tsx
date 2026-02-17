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

const UpdateMakeSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type UpdateMakeInput = z.infer<typeof UpdateMakeSchema>;

type Make = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  models?: any[];
};

const MakeEdit = ({ make }: { make: Make }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<UpdateMakeInput>({
    resolver: zodResolver(UpdateMakeSchema),
    defaultValues: {
      name: make.name,
    },
  });

  useEffect(() => {
    if (make) {
      form.reset({
        name: make.name,
      });
    }
  }, [make, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMakeInput) =>
      sdk.client.fetch(`/admin/makes/${make.id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      toast.success("Make updated successfully");
      queryClient.invalidateQueries({ queryKey: ["makes"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update make");
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
                <Input id="id" value={make.id} disabled />
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
              {make.models && make.models.length > 0 && (
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
