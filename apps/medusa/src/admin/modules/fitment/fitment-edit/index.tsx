import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Drawer,
  Heading,
  Hint,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import OptionSelect from "~/components/select";
import { sdk } from "~/lib/sdk";
import {
  BODY_STYLE_OPTIONS,
  DRIVE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "../../../../modules/fitment/constant";
import {
  Fitment,
  UpdateFitmentInput,
  UpdateFitmentSchema,
} from "../../../../modules/fitment/schema";

interface FitmentEditProps {
  fitment?: Fitment;
  onClose?: () => void;
  open?: boolean;
}

const FitmentEdit = ({
  fitment,
  onClose: propOnClose,
  open = true,
}: FitmentEditProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<UpdateFitmentInput>({
    resolver: zodResolver(UpdateFitmentSchema),
  });

  // Populate form when data loads
  useEffect(() => {
    if (fitment) {
      form.reset({
        id: fitment.id,
        body_style: fitment.body_style,
        drive: fitment.drive,
        doors: fitment.doors,
        transmission: fitment.transmission,
        year_end: fitment.year_end,
        year_start: fitment.year_start,
        model_id: fitment.model.id,
        engine_id: fitment.engine.id,
      });
    }
  }, [fitment, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateFitmentInput) =>
      sdk.client.fetch(`/admin/fitments`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      toast.success("Fitment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["fitments"] });
      if (fitment?.id) {
        queryClient.invalidateQueries({ queryKey: ["fitment", fitment?.id] });
      }
      handleClose();
    },
    onError: (error: any) => {
      toast.error("Failed to update fitment", {
        description: error.message || "An error occurred",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      navigate(-1);
    }
  };

  if (!fitment) {
    return null;
  }

  const { make, name: modelName } = fitment?.model || {
    make: { name: "" },
    name: "",
  };
  const {
    size,
    fuel,
    type: engineType,
  } = fitment?.engine || {
    size: "",
    fuel: "",
    type: "",
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading>
            Edit Fitment
          </Heading>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="flex flex-col overflow-y-auto">

              {/* Vehicle Info (Read-only) */}
              <div className="p-4">
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
              </div>

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
                variant="secondary"
                type="button"
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
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

export default FitmentEdit;
