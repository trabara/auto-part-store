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
import OptionSelect from "~/admin/components/option-select";
import { useCrudContext } from "~/admin/context/crud-context";
import { useUpdateMutation } from "~/admin/hooks/use-update-mutation";
import {
  BODY_STYLE_OPTIONS,
  DRIVE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "~/modules/fitment/constant";
import {
  UpdateFitmentInput,
  UpdateFitmentSchema
} from "~/modules/fitment/schema";
import { updateFitment } from "../data";
import { AdminFitmentWithProducts } from "../types";

const FitmentEditDrawer = () => {
  const { entity: fitment, isEdit, setIsEdit } = useCrudContext<AdminFitmentWithProducts>();

  const form = useForm<UpdateFitmentInput>({
    resolver: zodResolver(UpdateFitmentSchema),
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

            <div className="flex flex-col overflow-y-auto">

              {/* Vehicle Info (Read-only) */}
              {/* <div className="p-4">
                <h3 className="font-medium">
                  Vehicle Information (Read-only)
                </h3>
                <div className="mt-4 flex flex-col gap-y-4">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input value={make.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input value={modelName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Engine</Label>
                    <Input value={`${size}L ${engineType} ${fuel}`} disabled />
                  </div>
                </div>
              </div> */}

              {/* Editable Fields */}
              <div className="p-4">
                <h3 className="font-medium">Fitment Details</h3>
                <div className="mt-4 flex flex-col gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="body_style">Body Style *</Label>
                    <Controller
                      name="body_style"
                      control={form.control}
                      render={({ field }) => (
                        <OptionSelect
                          {...field}
                          options={BODY_STYLE_OPTIONS}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />
                    {form.formState.errors.body_style && (
                      <Hint variant="error">
                        {form.formState.errors.body_style.message}
                      </Hint>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drive">Drive Type *</Label>
                    <Controller
                      name="drive"
                      control={form.control}
                      render={({ field }) => (
                        <OptionSelect
                          {...field}
                          options={DRIVE_OPTIONS}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />
                    {form.formState.errors.drive && (
                      <Hint variant="error">
                        {form.formState.errors.drive.message}
                      </Hint>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission *</Label>
                    <Controller
                      name="transmission"
                      control={form.control}
                      render={({ field }) => (
                        <OptionSelect
                          {...field}
                          options={TRANSMISSION_OPTIONS}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />
                    {form.formState.errors.transmission && (
                      <Hint variant="error">
                        {form.formState.errors.transmission.message}
                      </Hint>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doors">Doors *</Label>
                    <Controller
                      name="doors"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                    {form.formState.errors.doors && (
                      <Hint variant="error">
                        {form.formState.errors.doors.message}
                      </Hint>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year_start">Year Start *</Label>
                    <Controller
                      name="year_start"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                    {form.formState.errors.year_start && (
                      <Hint variant="error">
                        {form.formState.errors.year_start.message}
                      </Hint>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year_end">Year End *</Label>
                    <Controller
                      name="year_end"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                    {form.formState.errors.year_end && (
                      <Hint variant="error">
                        {form.formState.errors.year_end.message}
                      </Hint>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex-1 flex items-center justify-end gap-x-2">
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
            </div>
          </Drawer.Body>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};

export default FitmentEditDrawer;
