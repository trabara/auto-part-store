import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, FocusModal, Heading, Hint, Input, Label, ProgressTabs, usePrompt } from "@medusajs/ui"
import { useCallback, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Fitment } from "../../../../modules/fitment/schema"
import OptionSelect from "../../../components/select"
import SelectOrCreateInput from "../../../components/select-or-create-input"
import { ENGINE_FUEL_OPTIONS, ENGINE_SIZE_OPTIONS, ENGINE_TYPE_OPTIONS, MAKE_OPTIONS, MODEL_OPTIONS, STEPS, Steps } from "./constant"



const CreateFitementPage = () => {

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

  const form = useForm<Fitment>({
    defaultValues: {
      model: { make: { name: undefined }, name: undefined },
      engine: { fuel: "gasoline", size: "1.0", tech: undefined, type: "I4" },
      body_style: "sedan",
      drive: "fwd",
      transmission: "manual",
      year_start: new Date().getFullYear(),
      year_end: new Date().getFullYear(),
    }
  })

  const steps = Object.keys(STEPS) as Steps[]
  const [active, setActive] = useState<Steps>("general")
  // const [validations, setValidations] = useState({})

  const validateTab = (value: Steps) => {
    const { accessor, validate, error } = STEPS[value]
    debugger
    try {
      const data = form.getValues()
      return validate(data)
    } catch (e) {
      console.log("Validation error: ", e)
      form.setError(accessor as any, { message: error })
    }
  }

  const currentStepIndex = steps.indexOf(active)
  const onSubmit = (data: Fitment) => {

    const step = steps[currentStepIndex]
    const isValid = validateTab(step)

    if (isValid && currentStepIndex < steps.length - 1) {
      setActive(steps[currentStepIndex + 1])
    } else {
      // submit form
      console.log("Submitting form with data: ", data)
    }

  }

  const handleTabsChange = useCallback((value: Steps) => {
    const stepIndex = steps.indexOf(value)
    const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : steps[0]


    if (validateTab(prevStep)) {
      setActive(value)
    }
  }, [active, validateTab])


  return (
    <FocusModal open onOpenChange={handleCancel}>
      <FocusModal.Content asChild>
        <form
          onSubmit={form.handleSubmit(onSubmit)}>
          <ProgressTabs value={active} onValueChange={(value) => handleTabsChange(value as Steps)} className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header className="">
              <div className="flex w-full items-center justify-between gap-x-4">
                <div className="-my-2 w-full max-w-[600px] border-l" >
                  <ProgressTabs.List >
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
                              options={[
                                { label: "Sedan", value: "sedan" },
                                { label: "SUV", value: "suv" },
                                { label: "Hatchback", value: "hatchback" },
                                { label: "Coupe", value: "coupe" },
                                { label: "Convertible", value: "convertible" },
                              ]}
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
                              options={[
                                { label: "FWD", value: "fwd" },
                                { label: "RWD", value: "rwd" },
                                { label: "AWD", value: "awd" },
                              ]}
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
                              options={[
                                { label: "Manual", value: "manual" },
                                { label: "Automatic", value: "automatic" },
                                { label: "CVT", value: "cvt" },
                              ]}
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