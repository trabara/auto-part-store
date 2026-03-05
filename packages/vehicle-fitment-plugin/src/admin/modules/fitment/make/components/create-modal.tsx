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
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import { CreateMakeInput, CreateMakeSchema } from "../../../../../modules/fitment/schema";
import { createMake } from "../data";


const MakeCreate = () => {
  const navigate = useNavigate();

  const form = useForm<CreateMakeInput>({
    resolver: zodResolver(CreateMakeSchema),
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["makes"],
    errorMessage: "Failed to create make. Please try again.",
    successMessage: "Make created successfully.",
    createFn: createMake,
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
                  Create Make
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  Add a new vehicle make to your catalog
                </p>
              </div>

              <div className="space-y-4">
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
                      <Hint>
                        Enter the manufacturer or brand name (e.g., Toyota,
                        Ford)
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

export default MakeCreate;
