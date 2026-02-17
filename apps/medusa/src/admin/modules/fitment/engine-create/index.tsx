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
import OptionSelect from "~/components/select";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_TYPE_OPTIONS,
  ENGINE_SIZE_OPTIONS,
} from "../../../../modules/fitment/constant";

const CreateEngineSchema = z.object({
  fuel: z.enum(["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]),
  type: z.enum(["I4", "V4", "V6", "V8", "ELECTRIC", "HYBRID"]),
  size: z.string().regex(/^\d+(\.\d+)?$/),
  tech: z.string().optional(),
});

type CreateEngineInput = z.infer<typeof CreateEngineSchema>;

const EngineCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CreateEngineInput>({
    resolver: zodResolver(CreateEngineSchema),
    defaultValues: {
      fuel: "GASOLINE",
      type: "I4",
      size: "1.0",
      tech: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEngineInput) =>
      sdk.client.fetch("/admin/engines", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      toast.success("Engine created successfully");
      queryClient.invalidateQueries({ queryKey: ["engines"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create engine");
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
