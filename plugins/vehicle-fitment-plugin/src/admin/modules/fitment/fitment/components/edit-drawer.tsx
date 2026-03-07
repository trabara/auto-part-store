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
  BODY_STYLE_OPTIONS,
  DRIVE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "../../../../../modules/fitment/constant";
import {
  UpdateFitmentInputSchema
} from "../../../../../modules/fitment/schema";
import OptionSelect from "../../../../components/option-select";
import { useCrudContext } from "../../../../context/crud-context";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { EngineSelectInput } from "../../engine/components/engine-select";
import { ModelSelectInput } from "../../model/components/model-select-input";
import { updateFitment } from "../data";
import { AdminFitmentWithProducts } from "../types";

const FitmentEditDrawer = () => {
  const { entity: fitment, isEdit, setIsEdit } = useCrudContext<AdminFitmentWithProducts>();

  const form = useForm({
    resolver: zodResolver(UpdateFitmentInputSchema),
  });


  // Populate form when data loads
  useEffect(() => {
    if (fitment) {
      const { model, engine, ...rest } = fitment;
      form.reset({
        ...rest,
        model_id: model.id,
        engine_id: engine.id,
      });
    }
  }, [fitment, form]);

  // Update mutation
  const updateMutation = useUpdateMutation({
    invalidateKeys: ["fitments", "fitment"],
    successMessage: "Fitment updated successfully.",
    errorMessage: "Failed to update fitment. Please try again.",
    updateFn: updateFitment(fitment?.id),
  });

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
    setIsEdit(false);
  });

  return (
    <Drawer open={isEdit} onOpenChange={setIsEdit}>
      <Drawer.Content asChild>
        <form onSubmit={onSubmit} className="flex flex-col">
          <Drawer.Header>
            <Heading>
              Edit Fitment
            </Heading>
          </Drawer.Header>
          <Drawer.Body>
            <div className="mt-4 flex flex-col gap-y-4">
              <Controller
                name="model_id"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Model
                    </Label>
                    <ModelSelectInput
                      {...field}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />

              <Controller
                name="engine_id"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Engine
                    </Label>
                    <EngineSelectInput {...field} />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />
              <Controller
                name="body_style"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Body Style
                    </Label>
                    <OptionSelect
                      {...field}
                      options={BODY_STYLE_OPTIONS}
                      onChange={(value) => field.onChange(value)}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />

              <Controller
                name="drive"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Drive Type
                    </Label>
                    <OptionSelect
                      {...field}
                      options={DRIVE_OPTIONS}
                      onChange={(value) => field.onChange(value)}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />

              <Controller
                name="transmission"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Transmission
                    </Label>
                    <OptionSelect
                      {...field}
                      options={TRANSMISSION_OPTIONS}
                      onChange={(value) => field.onChange(value)}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>

                )}
              />

              <Controller
                name="doors"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Doors
                    </Label>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />

              <Controller
                name="year_start"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Year Start
                    </Label>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />

              <Controller
                name="year_end"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Year End
                    </Label>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {error && (
                      <Hint variant="error">
                        {error.message}
                      </Hint>
                    )}
                  </div>
                )}
              />
            </div>

          </Drawer.Body>
          <Drawer.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEdit(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};

export default FitmentEditDrawer;
