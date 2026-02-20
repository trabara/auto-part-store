import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label,
  usePrompt
} from "@medusajs/ui";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import OptionSelect from "~/admin/components/option-select";
import { useCreateMutation } from "~/admin/hooks/use-create-mutation";
import { EngineSelectInput } from "~/admin/modules/fitment/engine/components/engine-select";
import { ModelSelectInput } from "~/admin/modules/fitment/model/components/model-select-input";
import { BODY_STYLE_OPTIONS, DOORS_OPTIONS, DRIVE_OPTIONS, TRANSMISSION_OPTIONS } from "~/modules/fitment/constant";
import { CreateFitmentInput, CreateFitmentSchema } from "~/modules/fitment/schema";
import { createFitment } from "../data";


const CreateFitmentModal = () => {
  const prompt = usePrompt();
  const navigate = useNavigate();

  const handleCancel = async () => {
    const confirmed = await prompt({
      title: "Are you sure you want to leave this form?",
      description:
        "You have unsaved changes that will be lost if you exit this form.",
      confirmText: "Continue",
      variant: "confirmation",
    });
    if (confirmed) {
      navigate(-1);
    }
  };


  const form = useForm({
    resolver: zodResolver(CreateFitmentSchema),
    defaultValues: {
      year_start: 2000,
      body_style: "SEDAN",
      drive: "FWD",
      transmission: "MANUAL",
      doors: 4,
    }
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["fitments"],
    errorMessage: "An error occurred while submitting the form. Please try again.",
    successMessage: "Fitment created successfully.",
    createFn: createFitment,
  });

  const onSubmit = (data: CreateFitmentInput) => {
    createMutation.mutate(data)
  }


  return (
    <FormProvider {...form}>
      <FocusModal open onOpenChange={handleCancel}>

        <FocusModal.Content>
          <FocusModal.Header >
          </FocusModal.Header>

          <form className="" onSubmit={form.handleSubmit(onSubmit)}>

            <div className="mx-auto max-w-lg py-4">
              <div>
                <Heading level="h1">Create Fitment</Heading>
                <Hint>Fill out the form below to create a new fitment.</Hint>
              </div>

              <div className="mt-8 space-y-6">

                <Controller
                  control={form.control}
                  name="year_start"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="year_start">Year Start</Label>
                      <Input id="year_start" type="number" {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="year_end"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="year_end">Year End (optional)</Label>
                      <Input id="year_end" type="number" {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="body_style"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="body_style">Body Style</Label>
                      <OptionSelect options={BODY_STYLE_OPTIONS} {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="drive"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="drive">Drive</Label>
                      <OptionSelect options={DRIVE_OPTIONS} {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="transmission"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <OptionSelect options={TRANSMISSION_OPTIONS} {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="doors"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="doors">Doors</Label>
                      <OptionSelect options={DOORS_OPTIONS} {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="model_id"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="model_id">Model</Label>
                      <ModelSelectInput  {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="engine_id"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="engine_id">Engine</Label>
                      <EngineSelectInput  {...field} />
                      {fieldState.error && (<Hint variant="error">{fieldState.error.message}</Hint>)}
                    </div>
                  )}
                />
              </div>

            </div>

            <div className="border-ui-border-base flex items-center justify-end gap-x-2 border-t p-4">
              <div className="flex items-center justify-end gap-x-2">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </div>
          </form>
        </FocusModal.Content>
      </FocusModal>
    </FormProvider>
  );
};

export default CreateFitmentModal;
