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
import OptionSelect from "../../../../components/option-select";
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_SIZE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
} from "../../../../../modules/fitment/constant";
import { CreateEngineSchema } from "../../../../../modules/fitment/schema";
import { createEngine } from "../data";


const EngineCreate = () => {
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(CreateEngineSchema),
    defaultValues: {
      fuel: "GASOLINE",
      type: "I4",
      size: "1.0",
      tech: "",
    },
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["fitment", "engines"],
    errorMessage: "Failed to create engine specification. Please try again.",
    successMessage: "Engine specification created successfully.",
    createFn: createEngine,
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
                  Create Engine
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  Add a new engine specification to your catalog
                </p>
              </div>

              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="fuel"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="fuel" className="font-medium">
                        Fuel Type <span className="text-ui-fg-error">*</span>
                      </Label>
                      <OptionSelect
                        placeholder="Select fuel type"
                        options={ENGINE_FUEL_OPTIONS}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="type"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="type" className="font-medium">
                        Engine Type <span className="text-ui-fg-error">*</span>
                      </Label>
                      <OptionSelect
                        placeholder="Select engine type"
                        options={ENGINE_TYPE_OPTIONS}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="size"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="size" className="font-medium">
                        Engine Size <span className="text-ui-fg-error">*</span>
                      </Label>
                      <OptionSelect
                        placeholder="Select engine size"
                        options={ENGINE_SIZE_OPTIONS}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                      <Hint>
                        Engine displacement in liters (e.g., 2.0, 3.5)
                      </Hint>
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="tech"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="tech" className="font-medium">
                        Technology
                      </Label>
                      <Input
                        id="tech"
                        placeholder="e.g., Turbo, DOHC, VVT"
                        aria-invalid={!!fieldState.error}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                      <Hint>
                        Optional: Specify engine technology (e.g., Turbo, DOHC)
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

export default EngineCreate;
