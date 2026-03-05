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
  LoaderFunctionArgs,
  useNavigate
} from "react-router-dom";
import OptionSelect from "../../../../components/option-select";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { sdk } from "../../../../lib/sdk";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_SIZE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
} from "../../../../../modules/fitment/constant";
import { Engine, UpdateEngineInput, UpdateEngineSchema } from "../../../../../modules/fitment/schema";
import { updateEngine } from "../data";


export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { engine } = await sdk.client.fetch<{ engine: Engine }>(
    `/admin/engines/${id}`,
  );
  return { engine };
}

const EngineEditDrawer = ({ engine }: { engine: Engine }) => {
  const navigate = useNavigate();

  const form = useForm<UpdateEngineInput>({
    resolver: zodResolver(UpdateEngineSchema),
    defaultValues: {
      fuel: engine.fuel,
      type: engine.type,
      size: engine.size,
      tech: engine.tech || "",
    },
  });

  useEffect(() => {
    if (engine) {
      form.reset({
        fuel: engine.fuel,
        type: engine.type,
        size: engine.size,
        tech: engine.tech || "",
      });
    }
  }, [engine, form]);

  const updateMutation = useUpdateMutation({
    invalidateKeys: ['engines'],
    errorMessage: "Failed to update engine. Please try again.",
    successMessage: "Engine updated successfully.",
    updateFn: updateEngine(engine?.id),
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
          <Heading level="h2">Edit Engine</Heading>
          <p className="text-ui-fg-subtle text-sm mt-1">
            Update engine information
          </p>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  Engine ID
                </Label>
                <Input id="id" value={engine.id} disabled />
              </div>

              {/* Fuel Type */}
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

              {/* Engine Type */}
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

              {/* Engine Size */}
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
                    <Hint>Engine displacement in liters</Hint>
                  </div>
                )}
              />

              {/* Technology */}
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

export default EngineEditDrawer;
