import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label
} from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { CreateModelInput, CreateModelInputSchema } from "../../../../../modules/fitment/schema";
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import { MakeSelectInput } from "../../make/components/make-select-input";
import { createModel } from "../data";


const ModelCreate = () => {
  const navigate = useNavigate();

  const form = useForm<CreateModelInput>({
    resolver: zodResolver(CreateModelInputSchema),
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["models"],
    errorMessage: "Failed to create model. Please try again.",
    successMessage: "Model created successfully.",
    createFn: createModel,
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
    handleClose();
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
                  name="make_id"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="make_id" className="font-medium">
                        Make <span className="text-ui-fg-error">*</span>
                      </Label>
                      <MakeSelectInput
                        placeholder="Select or create a make"
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
