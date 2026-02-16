import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { z } from "@medusajs/framework/zod";
import { sdk } from "~/lib/sdk";
import { MakesSelectInput } from "~/components/makes-select-input";

const CreateModelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  make_name: z.string().min(1, "Make is required"),
});

type CreateModelInput = z.infer<typeof CreateModelSchema>;

const ModelCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CreateModelInput>({
    resolver: zodResolver(CreateModelSchema),
    defaultValues: {
      name: "",
      make_name: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateModelInput) => {
      // Transform to API format: { name, make: { name } }
      return sdk.client.fetch("/admin/models", {
        method: "POST",
        body: {
          name: data.name,
          make: { name: data.make_name },
        },
      });
    },
    onSuccess: () => {
      toast.success("Model created successfully");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create model");
    },
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <FocusModal open onOpenChange={handleClose}>
      <FocusModal.Content>
        <form onSubmit={handleSubmit}>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <Button variant="secondary" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="small"
                isLoading={createMutation.isPending}
              >
                Create
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center py-16">
            <div className="w-full max-w-lg space-y-8">
              <div className="flex flex-col items-center text-center">
                <Heading level="h1" className="mb-2">
                  Create Model
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  Add a new vehicle model to your catalog
                </p>
              </div>

              <div className="space-y-4">
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
                      <Hint>
                        Enter the model name (e.g., Camry, Accord, Mustang)
                      </Hint>
                    </div>
                  )}
                />
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default ModelCreate;
