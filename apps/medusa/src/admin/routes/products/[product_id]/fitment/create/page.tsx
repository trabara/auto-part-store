import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, FocusModal, Heading, Hint, Input, Label, ProgressTabs, toast, usePrompt } from "@medusajs/ui"
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { CreateFitmentInput, Make, Model } from "../../../../../../modules/fitment/schema"
import OptionSelect from "../../../../../components/select"
import SelectOrCreateInput from "../../../../../components/select-or-create-input"
import { sdk } from "../../../../../lib/sdk"
import { BODY_STYLE_OPTIONS, DEFAULT_FORM_VALUES, DRIVE_OPTIONS, ENGINE_FUEL_OPTIONS, ENGINE_SIZE_OPTIONS, ENGINE_TYPE_OPTIONS, MODEL_OPTIONS, STEPS, Steps, TRANSMISSION_OPTIONS } from "./constant"

const CreateFitementPage = () => {
  const { product_id } = useParams()

  const cancelPrompt = usePrompt()
  const navigate = useNavigate()

  const handleCancel = async () => {
    const confirmed = await cancelPrompt({
      title: "Are you sure you want to leave this form?",
      description: "You have unsaved changes that will be lost if you exit this form.",
      confirmText: "Continue",
      variant: "confirmation"
    })
    if (confirmed) {
      navigate(-1)
    }
  }

  const form = useForm<CreateFitmentInput>({
    defaultValues: { ...DEFAULT_FORM_VALUES, product_id }
  })

  const steps = Object.keys(STEPS) as Steps[]
  const [active, setActive] = useState<Steps>("general")

  const validateTab = (value: Steps) => {
    const step = STEPS[value]

    try {
      return step.validate(form.getValues())
    } catch (e) {
      form.setError(step.accessor as any, { message: step.error })
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: CreateFitmentInput) => {
      // replace with actual API call
      return sdk.client.fetch('/admin/fitments', {
        method: "POST",
        body: data
      })
    },
    onSuccess: (data) => {
      console.log("Form submitted successfully: ", data)
      navigate(-1)
    },
    onError: (error) => {
      console.log("Form submission error: ", error)
      toast.error("An error occurred while submitting the form. Please try again.")
    }
  })

  const currentStepIndex = steps.indexOf(active)
  const onSubmit = (data: CreateFitmentInput) => {
    const step = steps[currentStepIndex]
    const isValid = validateTab(step)

    if (isValid && currentStepIndex < steps.length - 1) {
      setActive(steps[currentStepIndex + 1])
    } else {
      mutation.mutate(data)
    }
  }

  const handleTabsChange = useCallback((value: Steps) => {
    const stepIndex = steps.indexOf(value)
    const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : steps[0]


    if (validateTab(prevStep)) {
      setActive(value)
    }
  }, [active, validateTab])

  const { data: MAKE_OPTIONS, } = useQuery({
    queryKey: ["makes"],
    queryFn: () => {
      return sdk.client.fetch<{ makes: Make[] }>('/admin/makes', {
        query: {
          fields: "id,name"
        }
      }).then(({ makes }) => makes.map((make) => ({ label: make.name, value: make.id })))
    },
  })

  const { data: MODEL_OPTIONS, } = useQuery({
    queryKey: ["models"],
    queryFn: () => {
      return sdk.client.fetch<{ models: Model[] }>('/admin/models', {
        query: {
          fields: "id,name"
        }
      }).then(({ models }) => models.map(option => ({ label: option.name, value: option.id })))
    },
  })



  return (
    <FocusModal open onOpenChange={handleCancel}>
      <FocusModal.Content asChild>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ProgressTabs value={active} onValueChange={(value) => handleTabsChange(value as Steps)} className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex w-full items-center justify-between gap-x-4">
                <div className="-my-2 w-full max-w-[600px] border-l" >
                  <ProgressTabs.List>
                    <ProgressTabs.Trigger value="general">General</ProgressTabs.Trigger>
                    <ProgressTabs.Trigger value="make">Make</ProgressTabs.Trigger>
                    <ProgressTabs.Trigger value="model">Model</ProgressTabs.Trigger>
                    <ProgressTabs.Trigger value="engine">Engine</ProgressTabs.Trigger>
                  </ProgressTabs.List>
                </div>
              </div>

            </FocusModal.Header>
            <FocusModal.Body>
              <div className="flex flex-1 flex-col items-center overflow-y-auto">
                <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
                  <ProgressTabs.Content value="general">
                    <Heading>General</Heading>
                    <Hint>Enter the general details of the vehicle.</Hint>
                    <div className="mt-4 flex flex-col gap-y-6">
                      <div className="flex gap-x-4">
                        <Controller
                          control={form.control}
                          name="year_start"
                          render={({ field, fieldState }) => (
                            <div className="flex-1 flex flex-col gap-y-2">
                              <Label htmlFor="year-start">Year Start</Label>
                              <Input aria-invalid={!!fieldState.error} placeholder="Enter year start" type="number" {...field} />
                              {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                            </div>
                          )} />
                        <Controller
                          control={form.control}
                          name="year_end"
                          render={({ field, fieldState }) => (
                            <div className="flex-1 flex flex-col gap-y-2">
                              <Label htmlFor="year-end">Year End</Label>
                              <Input aria-invalid={!!fieldState.error} placeholder="Enter year end" type="number" {...field} />
                              {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                            </div>
                          )} />
                      </div>

                      <Controller
                        control={form.control}
                        name="body_style"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="body-style">Body Style</Label>
                            <OptionSelect
                              className="w-full"
                              placeholder="Enter body style"
                              options={BODY_STYLE_OPTIONS}
                              {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                      <Controller
                        control={form.control}
                        name="drive"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="drive">Drive</Label>
                            <OptionSelect
                              className="w-full"
                              placeholder="Enter drive type"
                              options={DRIVE_OPTIONS}
                              {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                      <Controller
                        control={form.control}
                        name="transmission"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="transmission">Transmission</Label>
                            <OptionSelect
                              className="w-full"
                              placeholder="Enter transmission type"
                              options={TRANSMISSION_OPTIONS}
                              {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                    </div>
                  </ProgressTabs.Content>
                  <ProgressTabs.Content value="make">
                    <Heading>Make</Heading>
                    <Hint>Enter the make of the vehicle.</Hint>
                    <div className="mt-4">
                      <Controller
                        control={form.control}
                        name="model.make.name"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="make-name">Name</Label>
                            <SelectOrCreateInput
                              className="w-full"
                              placeholder="Enter make name"
                              options={MAKE_OPTIONS}
                              error={fieldState.error?.message}
                              {...field} />
                          </div>
                        )} />
                    </div>

                  </ProgressTabs.Content>
                  <ProgressTabs.Content value="model">
                    <Heading>Model</Heading>
                    <Hint>Enter the model of the vehicle.</Hint>
                    <div className="mt-4">
                      <Controller
                        control={form.control}
                        name="model.name"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="model-name">Name</Label>
                            <SelectOrCreateInput
                              className="w-full"
                              placeholder="Enter model name"
                              options={MODEL_OPTIONS}
                              error={fieldState.error?.message}
                              {...field} />
                          </div>
                        )} />
                    </div>
                  </ProgressTabs.Content>
                  <ProgressTabs.Content value="engine">
                    <Heading>Engine</Heading>
                    <Hint>Enter the engine details of the vehicle.</Hint>
                    <div className="mt-4 flex flex-col gap-y-6">
                      <Controller
                        control={form.control}
                        name="engine.fuel"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-fuel">Fuel</Label>
                            <OptionSelect
                              className="w-full"
                              placeholder="Enter engine fuel"
                              options={ENGINE_FUEL_OPTIONS}
                              aria-invalid={!!fieldState.error}
                              {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                      <Controller
                        control={form.control}
                        name="engine.type"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-type">Type</Label>
                            <OptionSelect
                              className="w-full"
                              placeholder="Enter engine type"
                              options={ENGINE_TYPE_OPTIONS}
                              aria-invalid={!!fieldState.error}
                              {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                      <Controller
                        control={form.control}
                        name="engine.size"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-size">Size (L)</Label>
                            <OptionSelect
                              className="w-full"
                              placeholder="Enter engine size"
                              options={ENGINE_SIZE_OPTIONS}
                              aria-invalid={!!fieldState.error}
                              {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                      <Controller
                        control={form.control}
                        name="engine.tech"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-tech">Tech</Label>
                            <Input aria-invalid={!!fieldState.error} placeholder="Enter engine tech (e.g. VVT, Turbo, etc.)" {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                          </div>
                        )} />
                    </div>
                  </ProgressTabs.Content>
                </div>
              </div>
            </FocusModal.Body>
          </ProgressTabs>
          <div className="border-ui-border-base flex items-center justify-end gap-x-2 border-t p-4">
            <div className="flex items-center justify-end gap-x-2">
              <Button
                variant="secondary"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
              >
                Continue
              </Button>
            </div>
          </div>
        </form>

      </FocusModal.Content>
    </FocusModal >
  )
}

export const config = defineRouteConfig({

})

export default CreateFitementPage